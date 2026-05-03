import Result from "../models/Result.js";
import Course from "../models/Course.js";
import ParentStudentLink from "../models/ParentStudentLink.js";
import User from "../models/User.js";
import { emitAcademicUpdate } from "../utils/realtime.js";

export const uploadResult = async (req, res) => {
  try {
    const { student, course, score, grade } = req.body;
    const schoolId = req.user.school._id;
    const normalizedScore = Number(score);
    const normalizedGrade = String(grade || "").trim().toUpperCase();

    if (!Number.isFinite(normalizedScore) || normalizedScore < 0 || normalizedScore > 100) {
      return res.status(400).json({ message: "Score must be between 0 and 100." });
    }

    const [courseData, studentRecord] = await Promise.all([
      Course.findOne({
        _id: course,
        school: schoolId,
      }),
      User.findOne({
        _id: student,
        school: schoolId,
        role: "student",
      }).select("_id"),
    ]);

    if (!courseData) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (!studentRecord) {
      return res.status(404).json({ message: "Student not found in this school." });
    }

    if (
      Array.isArray(courseData.students) &&
      courseData.students.length > 0 &&
      !courseData.students.some((studentId) => String(studentId) === String(studentRecord._id))
    ) {
      return res.status(400).json({
        message: "This student is not assigned to the selected course.",
      });
    }

    if (
      req.user.role === "teacher" &&
      String(courseData.teacher) !== String(req.user._id)
    ) {
      return res.status(403).json({ message: "Not your course" });
    }

    const result = await Result.create({
      student: studentRecord._id,
      course,
      score: normalizedScore,
      grade: normalizedGrade,
      uploadedBy: req.user._id,
      school: schoolId,
    });

    req.app.get("io")?.emit("resultUpdated");

    const populatedResult = await Result.findById(result._id)
      .populate("student", "name")
      .populate("course", "name teacher")
      .populate("uploadedBy", "name");

    res.status(201).json(populatedResult);

    await emitAcademicUpdate({
      schoolId,
      studentIds: [studentRecord._id],
      entity: "result",
      action: "created",
      message: "Teacher saved a new result entry.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateResult = async (req, res) => {
  try {
    const { score, grade } = req.body;
    const normalizedScore = Number(score);
    const normalizedGrade = String(grade || "").trim().toUpperCase();

    if (!Number.isFinite(normalizedScore) || normalizedScore < 0 || normalizedScore > 100) {
      return res.status(400).json({ message: "Score must be between 0 and 100." });
    }

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

    result.score = normalizedScore;
    result.grade = normalizedGrade;

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

export const deleteResults = async (req, res) => {
  try {
    const resultIds = Array.isArray(req.body?.resultIds)
      ? [...new Set(req.body.resultIds.map((id) => String(id || "").trim()).filter(Boolean))]
      : [];

    if (resultIds.length === 0) {
      return res.status(400).json({ message: "Select at least one result entry to delete." });
    }

    const query = {
      _id: { $in: resultIds },
      school: req.user.school._id,
    };

    if (req.user.role === "teacher") {
      const teacherCourses = await Course.find({
        school: req.user.school._id,
        teacher: req.user._id,
      }).select("_id");

      query.course = { $in: teacherCourses.map((course) => course._id) };
    }

    const matchingResults = await Result.find(query).select("student");

    if (matchingResults.length === 0) {
      return res.status(404).json({ message: "No matching result entries were found." });
    }

    await Result.deleteMany({
      _id: { $in: matchingResults.map((result) => result._id) },
      school: req.user.school._id,
    });

    req.app.get("io")?.emit("resultUpdated");

    res.json({
      message: `${matchingResults.length} result entr${matchingResults.length === 1 ? "y" : "ies"} deleted successfully.`,
      deletedCount: matchingResults.length,
    });

    await emitAcademicUpdate({
      schoolId: req.user.school._id,
      studentIds: [...new Set(matchingResults.map((result) => String(result.student)))],
      entity: "result",
      action: "deleted",
      message: "Teacher deleted multiple result entries.",
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
      .populate("course", "name teacher")
      .populate("uploadedBy", "name")
      .sort({ createdAt: -1 });

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
      .populate("uploadedBy", "name")
      .sort({ createdAt: -1 });

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
