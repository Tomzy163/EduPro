import Course from "../models/Course.js";
import User from "../models/User.js";

// CREATE COURSE
export const createCourse = async (req, res) => {
  try {
    const { name, term } = req.body;

    const course = await Course.create({
      name,
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
    const { studentId, courseId } = req.body;

    const student = await User.findById(studentId);
    const course = await Course.findById(courseId);

    if (!student || !course) {
      return res.status(404).json({ message: "Student or Course not found" });
    }

    // Add course to student
    student.courses.push(courseId);
    await student.save();

    // Add student to course
    course.students.push(studentId);
    await course.save();

    res.json({ message: "Course assigned to student" });
  } catch (err) {
    res.status(500).json({ message: err.message });
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

    res.json({ message: "Teacher assigned", course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const linkParentToStudent = async (req, res) => {
  try {
    const { parentId, studentId } = req.body;

    const parent = await User.findById(parentId);
    const student = await User.findById(studentId);

    if (!parent || !student) {
      return res.status(404).json({ message: "User not found" });
    }

    // Link both ways
    parent.children.push(studentId);
    student.parent = parentId;

    await parent.save();
    await student.save();

    res.json({ message: "Parent linked to student" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getStudentsWithCourses = async (req, res) => {
  try {
    const students = await User.find({
      role: "student",
      school: req.user.school,
    });

    const courses = await Course.find()
      .populate("teacher", "name")
      .populate("students", "name");

    res.json({ students, courses });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTeachersWithCourses = async (req, res) => {
  try {
    const teachers = await User.find({
      role: "teacher",
      school: req.user.school,
    });

    const courses = await Course.find({
      school: req.user.school,
    }).populate("teacher");

    res.json({ teachers, courses });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};