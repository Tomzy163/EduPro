import Attendance from "../models/Attendance.js";
import Course from "../models/Course.js";
import ParentStudentLink from "../models/ParentStudentLink.js";
import User from "../models/User.js";
import { emitAcademicUpdate } from "../utils/realtime.js";

export const markAttendance = async (req, res) => {
  try {
    const { student, course, status } = req.body;
    const normalizedStatus = String(status || "").trim().toLowerCase();
    const schoolId = req.user.school._id;

    if (!["present", "absent"].includes(normalizedStatus)) {
      return res.status(400).json({ message: "Select a valid attendance status." });
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

    const attendanceDate = new Date();
    const dayStart = new Date(attendanceDate);
    const nextDay = new Date(attendanceDate);
    dayStart.setHours(0, 0, 0, 0);
    nextDay.setHours(24, 0, 0, 0);

    const attendance = await Attendance.findOneAndUpdate(
      {
        student: studentRecord._id,
        course,
        school: schoolId,
        date: {
          $gte: dayStart,
          $lt: nextDay,
        },
      },
      {
        student: studentRecord._id,
        course,
        status: normalizedStatus,
        school: schoolId,
        date: attendanceDate,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    res.json(attendance);

    await emitAcademicUpdate({
      schoolId,
      studentIds: [studentRecord._id],
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
