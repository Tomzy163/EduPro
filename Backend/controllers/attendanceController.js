import Attendance from "../models/Attendance.js";
import Course from "../models/Course.js";
import ParentStudentLink from "../models/ParentStudentLink.js";
import { emitAcademicUpdate } from "../utils/realtime.js";

export const markAttendance = async (req, res) => {
  try {
    const { student, course, status } = req.body;

    const courseData = await Course.findById(course);

    if (!courseData) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (
      req.user.role === "teacher" &&
      String(courseData.teacher) !== String(req.user._id)
    ) {
      return res.status(403).json({ message: "Not your course" });
    }

    const attendance = await Attendance.create({
      student,
      course,
      status,
      school: req.user.school._id,
    });

    res.json(attendance);

    await emitAcademicUpdate({
      schoolId: req.user.school._id,
      studentIds: [student],
      entity: "attendance",
      action: "updated",
      message: "Teacher updated attendance.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAttendanceList = async (req, res) => {
  try {
    const query = { school: req.user.school._id };

    if (req.user.role === "teacher") {
      const teacherCourses = await Course.find({
        school: req.user.school._id,
        teacher: req.user._id,
      }).select("_id");

      query.course = { $in: teacherCourses.map((course) => course._id) };
    }

    const records = await Attendance.find(query)
      .populate("student", "name email")
      .populate("course", "name")
      .sort({ createdAt: -1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAttendance = async (req, res) => {
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

    const records = await Attendance.find({
      student: studentId,
      school: schoolId,
    })
      .populate("course", "name")
      .sort({ date: -1, createdAt: -1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
