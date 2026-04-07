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

    // ✅ FIX: initialize arrays
    parent.children = parent.children || [];
    student.parents = student.parents || [];

    // ✅ prevent duplicates
    if (parent.children.includes(studentId)) {
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
      school: req.user.school._id,
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
    school: req.user.school._id,
  })
    .populate("parent", "name")
    .populate("student", "name")
    .populate("linkedBy", "name")
    .sort({ createdAt: -1 });

  res.json(history);
};