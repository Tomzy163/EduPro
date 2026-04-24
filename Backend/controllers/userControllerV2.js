import bcrypt from "bcryptjs";
import Course from "../models/Course.js";
import User from "../models/User.js";
import { emitSchoolAdminUpdate } from "../utils/realtime.js";
import {
  hasMinimumPasswordLength,
  isValidEmail,
  isValidObjectId,
  normalizeDisplayName,
  normalizeEmail,
  normalizePhoneNumber,
} from "../utils/validation.js";

const VALID_USER_ROLES = new Set(["admin", "teacher", "student", "parent"]);

const getSchoolId = (req) => req.user.school?._id || req.user.school;

const sanitizeUserInput = (payload = {}) => ({
  name: normalizeDisplayName(payload.name),
  email: normalizeEmail(payload.email),
  phoneNumber: normalizePhoneNumber(payload.phoneNumber),
  role: String(payload.role || "").trim().toLowerCase(),
});

const ensureUniqueSchoolEmail = async ({
  schoolId,
  email,
  excludeUserId = null,
}) => {
  const query = {
    school: schoolId,
    email,
  };

  if (excludeUserId) {
    query._id = { $ne: excludeUserId };
  }

  const existingUser = await User.findOne(query).select("_id");
  return !existingUser;
};

const countSchoolAdmins = async (schoolId, excludeUserId = null) => {
  const query = {
    school: schoolId,
    role: "admin",
  };

  if (excludeUserId) {
    query._id = { $ne: excludeUserId };
  }

  return User.countDocuments(query);
};

const findSchoolUser = async (userId, schoolId, role = "") => {
  if (!isValidObjectId(userId)) {
    return null;
  }

  const query = {
    _id: userId,
    school: schoolId,
  };

  if (role) {
    query.role = role;
  }

  return User.findOne(query);
};

const populateUserRecord = (userId) =>
  User.findById(userId).select("-password").populate("school");

const syncStudentCourse = async ({ student, course }) => {
  if (!student.courses.some((courseId) => String(courseId) === String(course._id))) {
    student.courses.push(course._id);
    await student.save();
  }

  if (!course.students.some((studentId) => String(studentId) === String(student._id))) {
    course.students.push(student._id);
    await course.save();
  }
};

export const createUser = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { name, email, phoneNumber, role } = sanitizeUserInput(req.body);
    const password = String(req.body.password || "");

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: "Name, email, password, and role are required.",
      });
    }

    if (!VALID_USER_ROLES.has(role)) {
      return res.status(400).json({ message: "Select a valid user role." });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }

    if (!hasMinimumPasswordLength(password)) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long.",
      });
    }

    const emailIsAvailable = await ensureUniqueSchoolEmail({ schoolId, email });
    if (!emailIsAvailable) {
      return res.status(409).json({
        message: "User already exists in this school.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      phoneNumber,
      password: hashedPassword,
      role,
      school: schoolId,
    });
    const createdUser = await User.findById(user._id).select("-password");

    res.status(201).json(createdUser);

    await emitSchoolAdminUpdate({
      schoolId,
      entity: "user",
      action: "created",
      message: `${role} account created by admin.`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await User.find({
      school: getSchoolId(req),
    })
      .select("-password")
      .sort({ role: 1, name: 1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUser = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      school: getSchoolId(req),
    }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyProfile = async (req, res) => {
  try {
    const user = await populateUserRecord(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const nextName = normalizeDisplayName(req.body.name || user.name);
    const nextEmail = normalizeEmail(req.body.email || user.email);
    const nextPhoneNumber = normalizePhoneNumber(
      req.body.phoneNumber ?? user.phoneNumber
    );

    if (!nextName || !nextEmail) {
      return res.status(400).json({ message: "Name and email are required." });
    }

    if (!isValidEmail(nextEmail)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }

    const emailIsAvailable = await ensureUniqueSchoolEmail({
      schoolId: user.school,
      email: nextEmail,
      excludeUserId: user._id,
    });

    if (!emailIsAvailable) {
      return res.status(409).json({ message: "Another user already uses this email." });
    }

    user.name = nextName;
    user.email = nextEmail;
    user.phoneNumber = nextPhoneNumber;

    await user.save();

    const updatedUser = await populateUserRecord(user._id);
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const existingUser = await findSchoolUser(req.params.id, schoolId);

    if (!existingUser) {
      return res.status(404).json({ message: "User not found or unauthorized." });
    }

    const { name, email, phoneNumber, role } = sanitizeUserInput({
      ...existingUser.toObject(),
      ...req.body,
    });

    if (!name || !email || !role) {
      return res.status(400).json({ message: "Name, email, and role are required." });
    }

    if (!VALID_USER_ROLES.has(role)) {
      return res.status(400).json({ message: "Select a valid user role." });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }

    const emailIsAvailable = await ensureUniqueSchoolEmail({
      schoolId,
      email,
      excludeUserId: existingUser._id,
    });

    if (!emailIsAvailable) {
      return res.status(409).json({
        message: "Another user already uses this email in this school.",
      });
    }

    if (existingUser.role === "admin" && role !== "admin") {
      const remainingAdmins = await countSchoolAdmins(schoolId, existingUser._id);

      if (remainingAdmins === 0) {
        return res.status(400).json({
          message: "Each school must keep at least one admin account.",
        });
      }
    }

    existingUser.name = name;
    existingUser.email = email;
    existingUser.phoneNumber = phoneNumber;
    existingUser.role = role;

    await existingUser.save();

    const updatedUser = await User.findById(existingUser._id).select("-password");
    res.json(updatedUser);

    await emitSchoolAdminUpdate({
      schoolId,
      entity: "user",
      action: "updated",
      message: "Admin updated a user record.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);

    if (String(req.params.id) === String(req.user._id)) {
      return res.status(400).json({
        message: "You cannot delete the account you are currently signed in with.",
      });
    }

    const user = await findSchoolUser(req.params.id, schoolId);

    if (!user) {
      return res.status(404).json({ message: "User not found or unauthorized." });
    }

    if (user.role === "admin") {
      const remainingAdmins = await countSchoolAdmins(schoolId, user._id);

      if (remainingAdmins === 0) {
        return res.status(400).json({
          message: "Each school must keep at least one admin account.",
        });
      }
    }

    await user.deleteOne();

    res.json({ message: "User deleted successfully" });

    await emitSchoolAdminUpdate({
      schoolId,
      entity: "user",
      action: "deleted",
      message: "Admin removed a user account.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const linkParentToStudent = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const parent = await findSchoolUser(req.body.parentId, schoolId, "parent");
    const student = await findSchoolUser(req.body.studentId, schoolId, "student");

    if (!parent || !student) {
      return res.status(404).json({ message: "Parent or student not found." });
    }

    if (!parent.children.some((id) => String(id) === String(student._id))) {
      parent.children.push(student._id);
      await parent.save();
    }

    if (!student.parents.some((id) => String(id) === String(parent._id))) {
      student.parents.push(parent._id);
    }

    student.parent = parent._id;
    await student.save();

    res.json({ message: "Parent linked successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const assignTeacher = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const student = await findSchoolUser(req.body.studentId, schoolId, "student");
    const teacher = await findSchoolUser(req.body.teacherId, schoolId, "teacher");

    if (!student || !teacher) {
      return res.status(404).json({ message: "Student or teacher not found." });
    }

    student.teacher = teacher._id;
    await student.save();

    res.json({ message: "Teacher assigned successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const assignStudent = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const student = await findSchoolUser(req.body.studentId, schoolId, "student");
    const course = isValidObjectId(req.body.courseId)
      ? await Course.findOne({
          _id: req.body.courseId,
          school: schoolId,
        })
      : null;

    if (!student || !course) {
      return res.status(404).json({ message: "Student or course not found." });
    }

    await syncStudentCourse({ student, course });

    res.json({ message: "Course assigned to student" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStudentsWithCourses = async (req, res) => {
  try {
    const students = await User.find({
      role: "student",
      school: getSchoolId(req),
    })
      .populate("courses")
      .populate("teacher", "name email")
      .populate("parent", "name email")
      .populate("parents", "name email")
      .select("-password");

    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTeachersWithCourses = async (req, res) => {
  try {
    const teachers = await User.find({
      role: "teacher",
      school: getSchoolId(req),
    })
      .populate("courses")
      .select("-password");

    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
