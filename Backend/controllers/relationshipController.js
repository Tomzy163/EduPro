import User from "../models/User.js";
import ParentStudentLink from "../models/ParentStudentLink.js";

export const linkParentToStudent = async (req, res) => {
  try {
    const { parentId, studentId } = req.body;

    if (!parentId || !studentId) {
      return res.status(400).json({ message: "Missing IDs" });
    }

    const parent = await User.findById(parentId);
    const student = await User.findById(studentId);

    if (!parent || parent.role !== "parent") {
      return res.status(400).json({ message: "Invalid parent" });
    }

    if (!student || student.role !== "student") {
      return res.status(400).json({ message: "Invalid student" });
    }

    console.log("PARENT CHILDREN:", parent.children);
    console.log("STUDENT PARENTS:", student.parents);

    // ✅ FIX: initialize arrays
    parent.children = parent.children || [];
    student.parents = student.parents || [];

    // ✅ prevent duplicates
    if (parent.children.some(id => id.toString() === studentId)) {
      return res.status(400).json({ message: "Already linked" });
    }

    // ✅ LINK BOTH SIDES
    parent.children.push(studentId);
    student.parents.push(parentId);

    await parent.save();
    await student.save();

    // ✅ SAVE HISTORY
    await ParentStudentLink.create({
      parent: parentId,
      student: studentId,
      school: req.user.school,
      linkedBy: req.user._id,
    });

    res.json({ message: "Parent linked to student" });

  } catch (error) {
  console.error("🔥 LINK ERROR FULL:", error);
  console.error("🔥 BODY:", req.body);
  console.error("🔥 USER:", req.user);
  res.status(500).json({ message: error.message });
}
};

export const getParentWithChildren = async (req, res) => {
  const parent = await User.findById(req.params.id)
    .populate("children", "name email");

  res.json(parent);
};

export const getStudentWithParents = async (req, res) => {
  const student = await User.findById(req.params.id)
    .populate("parents", "name email");

  res.json(student);
};

export const getLinkHistory = async (req, res) => {
  const history = await ParentStudentLink.find({
    school: req.user.school,
  })
    .populate("parent", "name")
    .populate("student", "name")
    .populate("linkedBy", "name")
    .sort({ createdAt: -1 });

  res.json(history);
};
// DELETE SINGLE LINK
// export const deleteLink = async (req, res) => {
//   try {
//     const link = await ParentStudentLink.findById(req.params.id);

//     if (!link) {
//       return res.status(404).json({ message: "Link not found" });
//     }

//     // remove from users too
//     await User.findByIdAndUpdate(link.parent, {
//       $pull: { children: link.student },
//     });

//     await User.findByIdAndUpdate(link.student, {
//       $pull: { parents: link.parent },
//     });

//     await link.deleteOne();

//     res.json({ message: "Link deleted" });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

export const deleteLink = async (req, res) => {
  try {
    const link = await ParentStudentLink.findById(req.params.id);

    if (!link) {
      return res.status(404).json({ message: "Link not found" });
    }

    await User.findByIdAndUpdate(link.parent, {
      $pull: { children: link.student },
    });

    await User.findByIdAndUpdate(link.student, {
      $pull: { parents: link.parent },
    });

    await link.deleteOne();

    res.json({ message: "Link deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// DELETE ALL LINKS
// export const deleteAllLinks = async (req, res) => {
//   try {
//     const links = await ParentStudentLink.find({
//       school: req.user.school,
//     });

//     for (let link of links) {
//       await User.findByIdAndUpdate(link.parent, {
//         $pull: { children: link.student },
//       });

//       await User.findByIdAndUpdate(link.student, {
//         $pull: { parents: link.parent },
//       });
//     }

//     await ParentStudentLink.deleteMany({
//       school: req.user.school._id,
//     });

//     res.json({ message: "All links deleted" });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };
export const deleteAllLinks = async (req, res) => {
  try {
    const links = await ParentStudentLink.find();

    for (let link of links) {
      await User.findByIdAndUpdate(link.parent, {
        $pull: { children: link.student },
      });

      await User.findByIdAndUpdate(link.student, {
        $pull: { parents: link.parent },
      });
    }

    await ParentStudentLink.deleteMany({});

    res.json({ message: "All links deleted" });
  } catch (err) {
    console.error("DELETE ALL ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// UPDATE LINK
// export const updateLink = async (req, res) => {
//   try {
//     const { parentId, studentId } = req.body;

//     const link = await ParentStudentLink.findById(req.params.id);

//     if (!link) {
//       return res.status(404).json({ message: "Link not found" });
//     }

//     // remove old relation
//     await User.findByIdAndUpdate(link.parent, {
//       $pull: { children: link.student },
//     });

//     await User.findByIdAndUpdate(link.student, {
//       $pull: { parents: link.parent },
//     });

//     // add new relation
//     await User.findByIdAndUpdate(parentId, {
//       $addToSet: { children: studentId },
//     });

//     await User.findByIdAndUpdate(studentId, {
//       $addToSet: { parents: parentId },
//     });

//     link.parent = parentId;
//     link.student = studentId;

//     await link.save();

//     res.json({ message: "Link updated" });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
export const updateLink = async (req, res) => {
  try {
    const { parentId, studentId } = req.body;

    const link = await ParentStudentLink.findById(req.params.id);

    if (!link) {
      return res.status(404).json({ message: "Link not found" });
    }

    // remove old
    await User.findByIdAndUpdate(link.parent, {
      $pull: { children: link.student },
    });

    await User.findByIdAndUpdate(link.student, {
      $pull: { parents: link.parent },
    });

    // add new
    await User.findByIdAndUpdate(parentId, {
      $addToSet: { children: studentId },
    });

    await User.findByIdAndUpdate(studentId, {
      $addToSet: { parents: parentId },
    });

    link.parent = parentId;
    link.student = studentId;

    await link.save();

    res.json({ message: "Link updated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};