import Result from "../models/Result.js";
import Course from "../models/Course.js";

// TEACHER uploads result
export const uploadResult = async (req, res) => {
  try {
    const { student, course, score, grade } = req.body;

    // Check course
    const courseData = await Course.findById(course);

    if (!courseData) {
      return res.status(404).json({ message: "Course not found" });
    }

    // 🔐 Restrict teacher to only their course
    if (req.user.role === "teacher" && courseData.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not your course" });
    }

    const result = await Result.create({
      student,
      course,
      score,
      grade,
      uploadedBy: req.user.id,
      school: req.user.school._id, // add school
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET student results
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