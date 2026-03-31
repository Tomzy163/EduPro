import Attendance from "../models/Attendance.js";
import Course from "../models/Course.js";

// MARK ATTENDANCE
export const markAttendance = async (req, res) => {
  try {
    const { student, course, status } = req.body;

    const courseData = await Course.findById(course);

    // 🔐 Teacher restriction
    if (req.user.role === "teacher" && courseData.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not your course" });
    }

    const attendance = await Attendance.create({
      student,
      course,
      status,
    });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET STUDENT ATTENDANCE
export const getAttendance = async (req, res) => {
  try {
    const records = await Attendance.find({ student: req.params.id, school: req.user.school })
      .populate("course", "name");

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};