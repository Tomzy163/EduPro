import Course from "../models/Course.js";
import User from "../models/User.js";

// CREATE COURSE
export const createCourse = async (req, res) => {
  try {
    const { name, teacher, term } = req.body;

    const course = await Course.create({
      name,
      teacher,
      term,
      school: req.user.school, // ✅ correct here
    });

    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL COURSES
export const getCourses = async (req, res) => {
  try {
    const courses = await Course.find({ school: req.user.school })
      .populate("teacher", "name email")
      .populate("students", "name email");

    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ASSIGN STUDENT TO COURSE
export const assignStudent = async (req, res) => {
  try {
    const { courseId, studentId } = req.body;

    const course = await Course.findById(courseId);

    if (!course) return res.status(404).json({ message: "Course not found" });

    if (!course.students.includes(studentId)) {
      course.students.push(studentId);
    }

    await course.save();

    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ASSIGN TEACHER
export const assignTeacher = async (req, res) => {
  try {
    const { courseId, teacherId } = req.body;

    const course = await Course.findById(courseId);

    if (!course) return res.status(404).json({ message: "Course not found" });

    course.teacher = teacherId;

    await course.save();

    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};