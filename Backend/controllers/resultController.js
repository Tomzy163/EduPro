import Result from "../models/Result.js";
import Course from "../models/Course.js";

// ✅ CREATE (UPLOAD RESULT)
export const uploadResult = async (req, res) => {
  try {
    const { student, course, score, grade } = req.body;

    const courseData = await Course.findById(course);

    if (!courseData) {
      return res.status(404).json({ message: "Course not found" });
    }

    // 🔐 Teacher restriction
    if (
      req.user.role === "teacher" &&
      courseData.teacher.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Not your course" });
    }

    const result = await Result.create({
      student,
      course,
      score,
      grade,
      uploadedBy: req.user.id,
      school: req.user.school._id,
    });

    req.app.get("io").emit("resultUpdated");

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✏️ UPDATE RESULT
export const updateResult = async (req, res) => {
  try {
    const { score, grade } = req.body;

    const result = await Result.findById(req.params.id).populate("course");

    if (!result) {
      return res.status(404).json({ message: "Result not found" });
    }

    // 🔐 Restrict teacher
    if (
      req.user.role === "teacher" &&
      result.course.teacher.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Not allowed" });
    }

    result.score = score;
    result.grade = grade;

    await result.save();

    req.app.get("io").emit("resultUpdated");

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ❌ DELETE RESULT
export const deleteResult = async (req, res) => {
  try {
    const result = await Result.findById(req.params.id).populate("course");

    if (!result) {
      return res.status(404).json({ message: "Result not found" });
    }

    // 🔐 Restrict teacher
    if (
      req.user.role === "teacher" &&
      result.course.teacher.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await result.deleteOne();

    req.app.get("io").emit("resultUpdated");

    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📥 GET TEACHER RESULTS
export const getTeacherResults = async (req, res) => {
  try {
    const results = await Result.find({
      school: req.user.school._id,
    })
      .populate("student", "name")
      .populate("course", "name teacher");

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🎓 GET STUDENT RESULTS
export const getStudentResults = async (req, res) => {
  try {
    const results = await Result.find({
      student: req.params.id,
      school: req.user.school._id,
    })
      .populate("course", "name term")
      .populate("uploadedBy", "name");

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};