import Result from "../models/Result.js";
import Course from "../models/Course.js";
import ParentStudentLink from "../models/ParentStudentLink.js";
import { emitAcademicUpdate } from "../utils/realtime.js";

export const uploadResult = async (req, res) => {
  try {
    const { student, course, score, grade } = req.body;

    const courseData = await Course.findOne({
      _id: course,
      school: req.user.school._id,
    });

    if (!courseData) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (
      req.user.role === "teacher" &&
      String(courseData.teacher) !== String(req.user._id)
    ) {
      return res.status(403).json({ message: "Not your course" });
    }

    const result = await Result.create({
      student,
      course,
      score,
      grade,
      uploadedBy: req.user._id,
      school: req.user.school._id,
    });

    req.app.get("io")?.emit("resultUpdated");

    res.json(result);

    await emitAcademicUpdate({
      schoolId: req.user.school._id,
      studentIds: [student],
      entity: "result",
      action: "created",
      message: "Teacher uploaded a result.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateResult = async (req, res) => {
  try {
    const { score, grade } = req.body;

    const result = await Result.findOne({
      _id: req.params.id,
      school: req.user.school._id,
    }).populate("course");

    if (!result) {
      return res.status(404).json({ message: "Result not found" });
    }

    if (
      req.user.role === "teacher" &&
      String(result.course.teacher) !== String(req.user._id)
    ) {
      return res.status(403).json({ message: "Not allowed" });
    }

    result.score = score;
    result.grade = grade;

    await result.save();

    req.app.get("io")?.emit("resultUpdated");

    res.json(result);

    await emitAcademicUpdate({
      schoolId: req.user.school._id,
      studentIds: [result.student],
      entity: "result",
      action: "updated",
      message: "Teacher updated a result.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteResult = async (req, res) => {
  try {
    const result = await Result.findOne({
      _id: req.params.id,
      school: req.user.school._id,
    }).populate("course");

    if (!result) {
      return res.status(404).json({ message: "Result not found" });
    }

    if (
      req.user.role === "teacher" &&
      String(result.course.teacher) !== String(req.user._id)
    ) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await result.deleteOne();

    req.app.get("io")?.emit("resultUpdated");

    res.json({ message: "Deleted" });

    await emitAcademicUpdate({
      schoolId: req.user.school._id,
      studentIds: [result.student],
      entity: "result",
      action: "deleted",
      message: "Teacher deleted a result.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTeacherResults = async (req, res) => {
  try {
    const query = { school: req.user.school._id };

    if (req.user.role === "teacher") {
      const teacherCourses = await Course.find({
        school: req.user.school._id,
        teacher: req.user._id,
      }).select("_id");

      query.course = { $in: teacherCourses.map((course) => course._id) };
    }

    const results = await Result.find(query)
      .populate("student", "name")
      .populate("course", "name teacher");

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStudentResults = async (req, res) => {
  try {
    const studentId = req.params.id;
    const schoolId = req.user.school._id;

    if (
      req.user.role === "student" &&
      String(req.user._id) !== String(studentId)
    ) {
      return res.status(403).json({ message: "Not allowed" });
    }

    if (req.user.role === "parent") {
      const linkedRecord = await ParentStudentLink.findOne({
        parent: req.user._id,
        student: studentId,
        school: schoolId,
      });

      if (!linkedRecord) {
        return res.status(403).json({ message: "Student is not linked to this parent." });
      }
    }

    const results = await Result.find({
      student: studentId,
      school: schoolId,
    })
      .populate("course", "name term")
      .populate("uploadedBy", "name");

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
