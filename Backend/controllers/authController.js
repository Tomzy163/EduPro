import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import School from "../models/School.js";
import nodemailer from "nodemailer";

// Generate token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

//
// =======================
// REGISTER SCHOOL + ADMIN
// =======================
export const register = async (req, res) => {
  try {
    const { name, email, password, school: schoolName } = req.body;

    if (!schoolName) {
      return res.status(400).json({ message: "School is required" });
    }

    // Check if school exists
    let school = await School.findOne({ name: schoolName });

    if (school) {
      return res.status(400).json({
        message: "School already exists. Please login.",
      });
    }

    // Create school
    school = await School.create({ name: schoolName });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin
    const admin = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "admin",
      school: school._id, // ✅ FIXED
    });

    res.status(201).json({
      message: "School registered successfully",
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        school: school.name,
      },
      token: generateToken(admin._id),
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

//
// =======================
// LOGIN
// =======================
export const loginUser = async (req, res) => {
  try {
    const { email, password, school: schoolName } = req.body;

    if (!email || !password || !schoolName) {
      return res.status(400).json({
        message: "Email, password, and school are required",
      });
    }

    // Find school
    const school = await School.findOne({ name: schoolName });
    if (!school) {
      return res.status(400).json({ message: "School not found" });
    }

    // Find user inside that school
    const user = await User.findOne({
      email,
      school: school._id,
    });

    if (!user) {
      return res.status(400).json({
        message: "User not found in this school",
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        school: school.name,
      },
      token: generateToken(user._id),
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//
// =======================
// ADMIN CREATES USERS
// =======================
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({
      email,
      school: req.user.school._id,
    });

    if (existing) {
      return res.status(400).json({
        message: "User already exists in this school",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      school: req.user.school._id, // ✅ enforce school
    });

    res.json(user);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//
// =======================
// FORGOT PASSWORD
// =======================
// import School from "../models/School.js";

export const forgotPassword = async (req, res) => {
  try {
    const { email, school } = req.body;

    const schoolDoc = await School.findOne({ name: school });
    if (!schoolDoc) return res.status(404).json({ message: "School not found" });

    const user = await User.findOne({ email, school: schoolDoc._id });
    if (!user) return res.status(404).json({ message: "User not found in this school" });

    // Generate reset token
    const token = Math.random().toString(36).substring(2, 10);
    user.resetToken = token;
    user.resetTokenExpire = Date.now() + 15 * 60 * 1000; // 15 min
    await user.save();

    // Nodemailer setup
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Password Reset Link",
      text: `Hello ${user.name},\n\nClick this link to reset your password:\n
      http://localhost:5173/reset-password?token=${token}\n
      This link expires in 15 minutes.`,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: "Reset link sent to your email" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};


//
// =======================
// RESET PASSWORD
// =======================
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    // const user = await User.findOne({ resetToken: token });

    if (!user) {
      return res.status(400).json({ message: "Invalid token" });
    }

        const user = await User.findOne({
      resetToken: token,
      resetTokenExpire: { $gt: Date.now() },
    });

    user.password =  await bcrypt.hash(password, 10); // ⚠️ hash later if needed
    user.resetToken = null;

    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};