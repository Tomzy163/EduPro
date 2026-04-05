// backend/controllers/userController.js
import User from "../models/User.js";
import bcrypt from "bcryptjs";

/* =========================
   REGISTER ADMIN (NEW SCHOOL)
========================= */
export const registerUser = async (req, res) => {
  try {
    console.log("Incoming data:", req.body);

    const { name, email, password, school } = req.body;

    // ✅ Validate
    if (!name || !email || !password || !school) {
      return res.status(400).json({
        message: "All fields including school are required",
      });
    }

    const existingUser = await User.findOne({ email, school });
    if (existingUser) {
      return res.status(400).json({
        message: "Admin already exists for this school",
      });
    }
          // Check if school already has an admin
      const existingAdmin = await User.findOne({
        school: school._id,
        role: "admin",
      });

      // If admin exists → no more admins
      let userRole = role || "admin";

      if (existingAdmin && userRole === "admin") {
        return res.status(400).json({
          message: "Admin already exists for this school",
        });
      }

    const hashedPassword = await bcrypt.hash(password, 10);

      //     const user = await User.create({
      // name,
      // email,
      // password: hashedPassword,
      // role, // or remove this function entirely
      // school: req.user.school, // 🔥 ensure same school
      //   });

      const user = await User.create({
  name,
  email,
  password: hashedPassword,
  school: school._id,
  role: userRole,
});

    res.status(201).json({
      message: "Admin registered successfully",
      user,
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};

/* =========================
   GET USERS (SAME SCHOOL)
========================= */
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({
      school: req.user.school._id,
    }).select("-password");

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   CREATE USER (ADMIN)
========================= */
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({
      email,
      school: req.user.school._id,
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists in this school" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

            const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role, // ✅ use the role from frontend
      school: req.user.school._id,
    });
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   GET SINGLE USER
========================= */
export const getUser = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      school: req.user.school,
    }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   UPDATE USER
========================= */
export const updateUser = async (req, res) => {
  try {
    const { name, email, role } = req.body;

    const user = await User.findOneAndUpdate(
      {
        _id: req.params.id,
        school: req.user.school,
      },
      { name, email, role },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found or unauthorized" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   DELETE USER
========================= */
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findOneAndDelete({
      _id: req.params.id,
      school: req.user.school,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found or unauthorized" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   LINK PARENT ↔ STUDENT
========================= */
export const linkParentToStudent = async (req, res) => {
  try {
    const { parentId, studentId } = req.body;

    const parent = await User.findById(parentId);
    const student = await User.findById(studentId);

    if (!parent || !student) {
      return res.status(404).json({ message: "User not found" });
    }

    // ensure same school
    if (parent.school.toString() !== req.user.school.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    student.parent = parentId;

    if (!parent.children.includes(studentId)) {
      parent.children.push(studentId);
    }

    await student.save();
    await parent.save();

    res.json({ message: "Parent linked successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   ASSIGN TEACHER TO STUDENT
========================= */
export const assignTeacher = async (req, res) => {
  try {
    const { studentId, teacherId } = req.body;

    const student = await User.findById(studentId);
    const teacher = await User.findById(teacherId);

    if (!student || !teacher) {
      return res.status(404).json({ message: "User not found" });
    }

    student.teacher = teacherId;

    await student.save();

    res.json({ message: "Teacher assigned successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   ASSIGN COURSE TO STUDENT
========================= */
export const assignStudent = async (req, res) => {
  try {
    const { studentId, courseId } = req.body;

    const student = await User.findById(studentId);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // multiple courses allowed
    if (!student.courses.includes(courseId)) {
      student.courses.push(courseId);
    }

    await student.save();

    res.json({ message: "Course assigned to student" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   GET STUDENTS WITH COURSES
========================= */
export const getStudentsWithCourses = async (req, res) => {
  try {
    const students = await User.find({
      role: "student",
      school: req.user.school._id,
    })
      .populate("courses")
      .populate("teacher", "name email")
      .populate("parent", "name email");

    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   GET TEACHERS WITH COURSES
========================= */
export const getTeachersWithCourses = async (req, res) => {
  try {
    const teachers = await User.find({
      role: "teacher",
      school: req.user.school._id,
    }).populate("courses");

    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};