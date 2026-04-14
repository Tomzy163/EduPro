import Course from "../models/Course.js";
import User from "../models/User.js";
import { emitSchoolAdminUpdate } from "../utils/realtime.js";

// CREATE COURSE
export const createCourse = async (req, res) => {
  try {
    const { name, term } = req.body;

    const course = await Course.create({
      name,
      term,
      school: req.user.school._id, // ✅ correct here
    });

    res.json(course);

    await emitSchoolAdminUpdate({
      schoolId: req.user.school._id,
      entity: "course",
      action: "created",
      message: `Admin created the ${course.name} course.`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL COURSES
export const getCourses = async (req, res) => {
  try {
    const courses = await Course.find({ school: req.user.school._id })
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

    if (student.role !== "student") {
      return res.status(400).json({ message: "Selected user is not a student" });
    }

    if (String(student.school) !== String(req.user.school._id)) {
      return res.status(403).json({ message: "Student is not in your school" });
    }

    if (String(course.school) !== String(req.user.school._id)) {
      return res.status(403).json({ message: "Course is not in your school" });
    }

    if (!student.courses.includes(courseId)) {
      student.courses.push(courseId);
    }
    await student.save();

    if (!course.students.some((id) => id.toString() === studentId.toString())) {
      course.students.push(studentId);
    }
    await course.save();

    const updatedCourse = await Course.findById(courseId)
      .populate("teacher", "name email")
      .populate("students", "name email");

    res.json({
      message: "Course assigned to student",
      course: updatedCourse,
    });

    await emitSchoolAdminUpdate({
      schoolId: req.user.school._id,
      entity: "course",
      action: "student-assigned",
      message: "Admin assigned students to a course.",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ASSIGN TEACHER
export const assignTeacher = async (req, res) => {
  try {
    const { courseId, teacherId } = req.body;

    const course = await Course.findById(courseId);
    const teacher = await User.findById(teacherId);

    if (!course) return res.status(404).json({ message: "Course not found" });
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    if (teacher.role !== "teacher") {
      return res.status(400).json({ message: "Selected user is not a teacher" });
    }

    if (String(teacher.school) !== String(req.user.school._id)) {
      return res.status(403).json({ message: "Teacher is not in your school" });
    }

    if (String(course.school) !== String(req.user.school._id)) {
      return res.status(403).json({ message: "Course is not in your school" });
    }

    if (course.teacher && String(course.teacher) !== String(teacherId)) {
      await User.findByIdAndUpdate(course.teacher, {
        $pull: { courses: course._id },
      });
    }

    course.teacher = teacherId;
    await course.save();

    if (!teacher.courses.some((id) => id.toString() === courseId.toString())) {
      teacher.courses.push(course._id);
      await teacher.save();
    }

    const updatedCourse = await Course.findById(courseId)
      .populate("teacher", "name email")
      .populate("students", "name email");

    res.json({ message: "Teacher assigned", course: updatedCourse });

    await emitSchoolAdminUpdate({
      schoolId: req.user.school._id,
      entity: "course",
      action: "teacher-assigned",
      message: "Admin assigned a teacher to a course.",
    });
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
      school: req.user.school._id,
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
      school: req.user.school._id,
    });

    const courses = await Course.find({
      school: req.user.school._id,
    }).populate("teacher");

    res.json({ teachers, courses });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
