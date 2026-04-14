import User from "../models/User.js";
import ParentStudentLink from "../models/ParentStudentLink.js";
import { emitSchoolAdminUpdate } from "../utils/realtime.js";

const syncPrimaryParent = async (studentId) => {
  const student = await User.findById(studentId).select("parents parent");

  if (!student) {
    return;
  }

  const remainingParents = student.parents || [];

  if (remainingParents.length === 0) {
    student.parent = undefined;
    await student.save();
    return;
  }

  const primaryParentId = remainingParents[0];

  if (String(student.parent || "") !== String(primaryParentId)) {
    student.parent = primaryParentId;
    await student.save();
  }
};

export const linkParentToStudent = async (req, res) => {
  try {
    const { parentId, studentId, studentIds } = req.body;
    const schoolId = req.user.school._id;
    const targetStudentIds = Array.isArray(studentIds) && studentIds.length
      ? studentIds
      : studentId
        ? [studentId]
        : [];

    if (!parentId || targetStudentIds.length === 0) {
      return res.status(400).json({ message: "Select a parent and at least one student." });
    }

    const parent = await User.findOne({
      _id: parentId,
      role: "parent",
      school: schoolId,
    });

    if (!parent) {
      return res.status(404).json({ message: "Parent not found in this school." });
    }

    const students = await User.find({
      _id: { $in: targetStudentIds },
      role: "student",
      school: schoolId,
    });

    if (students.length === 0) {
      return res.status(404).json({ message: "No valid students were selected." });
    }

    const linkedStudents = [];

    for (const student of students) {
      await User.findByIdAndUpdate(parent._id, {
        $addToSet: { children: student._id },
      });

      await User.findByIdAndUpdate(student._id, {
        $addToSet: { parents: parent._id },
        $set: { parent: parent._id },
      });

      const existingLink = await ParentStudentLink.findOne({
        parent: parent._id,
        student: student._id,
        school: schoolId,
      });

      if (!existingLink) {
        await ParentStudentLink.create({
          parent: parent._id,
          student: student._id,
          school: schoolId,
          linkedBy: req.user._id,
        });
      }

      linkedStudents.push({
        _id: student._id,
        name: student.name,
      });
    }

    res.json({
      message: "Parent linked successfully.",
      linkedStudents,
    });

    await emitSchoolAdminUpdate({
      schoolId,
      entity: "relationship",
      action: "created",
      message: "Admin linked a parent to student records.",
    });
  } catch (error) {
    console.error("LINK ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getParentWithChildren = async (req, res) => {
  try {
    const schoolId = req.user.school._id;
    const requestedParentId = req.params.id;

    if (
      req.user.role === "parent" &&
      String(req.user._id) !== String(requestedParentId)
    ) {
      return res.status(403).json({ message: "Not allowed to view this parent record." });
    }

    const parent = await User.findOne({
      _id: requestedParentId,
      role: "parent",
      school: schoolId,
    }).populate("children", "name email");

    if (!parent) {
      return res.status(404).json({ message: "Parent record not found." });
    }

    res.json(parent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStudentWithParents = async (req, res) => {
  try {
    const student = await User.findOne({
      _id: req.params.id,
      role: "student",
      school: req.user.school._id,
    }).populate("parents", "name email");

    if (!student) {
      return res.status(404).json({ message: "Student record not found." });
    }

    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getLinkHistory = async (req, res) => {
  try {
    const history = await ParentStudentLink.find({
      school: req.user.school._id,
    })
      .populate("parent", "name email")
      .populate("student", "name email")
      .populate("linkedBy", "name")
      .sort({ createdAt: -1 });

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteLink = async (req, res) => {
  try {
    const link = await ParentStudentLink.findOne({
      _id: req.params.id,
      school: req.user.school._id,
    });

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
    await syncPrimaryParent(link.student);

    res.json({ message: "Link deleted" });

    await emitSchoolAdminUpdate({
      schoolId: req.user.school._id,
      entity: "relationship",
      action: "deleted",
      message: "Admin removed a parent-student link.",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteAllLinks = async (req, res) => {
  try {
    const schoolId = req.user.school._id;
    const links = await ParentStudentLink.find({ school: schoolId });
    const affectedStudents = [...new Set(links.map((link) => String(link.student)))];

    for (const link of links) {
      await User.findByIdAndUpdate(link.parent, {
        $pull: { children: link.student },
      });

      await User.findByIdAndUpdate(link.student, {
        $pull: { parents: link.parent },
      });
    }

    await ParentStudentLink.deleteMany({ school: schoolId });

    for (const studentId of affectedStudents) {
      await syncPrimaryParent(studentId);
    }

    res.json({ message: "All links deleted" });

    await emitSchoolAdminUpdate({
      schoolId,
      entity: "relationship",
      action: "deleted-all",
      message: "Admin cleared all parent-student links.",
    });
  } catch (err) {
    console.error("DELETE ALL ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

export const updateLink = async (req, res) => {
  try {
    const { parentId, studentId } = req.body;
    const schoolId = req.user.school._id;

    if (!parentId || !studentId) {
      return res.status(400).json({ message: "Select a parent and student." });
    }

    const link = await ParentStudentLink.findOne({
      _id: req.params.id,
      school: schoolId,
    });

    if (!link) {
      return res.status(404).json({ message: "Link not found" });
    }

    const [nextParent, nextStudent] = await Promise.all([
      User.findOne({ _id: parentId, role: "parent", school: schoolId }),
      User.findOne({ _id: studentId, role: "student", school: schoolId }),
    ]);

    if (!nextParent || !nextStudent) {
      return res.status(404).json({ message: "Parent or student not found in this school." });
    }

    const oldParentId = link.parent;
    const oldStudentId = link.student;

    await User.findByIdAndUpdate(oldParentId, {
      $pull: { children: oldStudentId },
    });

    await User.findByIdAndUpdate(oldStudentId, {
      $pull: { parents: oldParentId },
    });

    await User.findByIdAndUpdate(nextParent._id, {
      $addToSet: { children: nextStudent._id },
    });

    await User.findByIdAndUpdate(nextStudent._id, {
      $addToSet: { parents: nextParent._id },
      $set: { parent: nextParent._id },
    });

    link.parent = nextParent._id;
    link.student = nextStudent._id;
    link.linkedBy = req.user._id;

    await link.save();
    await syncPrimaryParent(oldStudentId);

    if (String(oldStudentId) !== String(nextStudent._id)) {
      await syncPrimaryParent(nextStudent._id);
    }

    res.json({ message: "Link updated" });

    await emitSchoolAdminUpdate({
      schoolId,
      entity: "relationship",
      action: "updated",
      message: "Admin updated a parent-student link.",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
