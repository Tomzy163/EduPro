import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import School from "../models/School.js";
import nodemailer from "nodemailer";

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      school: user.school,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

export const register = async (req, res) => {
  try {
    const { name, email, password, school: schoolName } = req.body;

    if (!schoolName) {
      return res.status(400).json({ message: "School is required" });
    }

    let school = await School.findOne({ name: schoolName.trim() });

    if (school) {
      return res.status(400).json({
        message: "School already exists. Please login.",
      });
    }

    school = await School.create({ name: schoolName });

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "admin",
      school: school._id,
    });

    res.status(201).json({
      message: "School registered successfully",
      user: {
        _id: admin._id,
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        school: school.name,
      },
      token: generateToken(admin),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password, school: schoolName } = req.body;

    if (!email || !password || !schoolName) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const school = await School.findOne({
      name: { $regex: `^${schoolName}$`, $options: "i" },
    });

    if (!school) {
      return res.status(400).json({ message: "School not found" });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
      school: school._id,
    });

    if (!user) {
      return res.status(400).json({
        message: "User not found in this school",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    res.json({
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        school: school.name,
      },
      token: generateToken(user),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

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
      school: req.user.school._id,
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email, school } = req.body;

    const schoolDoc = await School.findOne({ name: school });
    if (!schoolDoc) return res.status(404).json({ message: "School not found" });

    const user = await User.findOne({ email, school: schoolDoc._id });
    if (!user) return res.status(404).json({ message: "User not found in this school" });

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetTokenExpire = Date.now() + 15 * 60 * 1000;
    await user.save();

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
      text: `Hello ${user.name},\n\nClick this link to reset your password:\n${process.env.CLIENT_URL}/reset-password?token=${token}\nThis link expires in 15 minutes.`,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: "Reset link sent to your email" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetToken = null;
    user.resetTokenExpire = null;

    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
