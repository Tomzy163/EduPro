// routes/auth.js
import express from "express";
import User from "../models/User.js";
import School from "../models/School.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  loginUser,
  register,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";

const router = express.Router();

// router.post("/register", register);
// router.post("/login", loginUser);

// ✅ ADD THESE
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// ----------------------
// REGISTER
// ----------------------
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, school: schoolName, role } = req.body;

    if (!name || !email || !password || !schoolName) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Find or create the school
    let school = await School.findOne({ name: schoolName });
    if (!school) {
      school = await School.create({ name: schoolName });
    }

    // Check if user already exists in this school
    const existingUser = await User.findOne({ email, school: school._id });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists in this school" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      school: school._id,
      role: role || "admin", // default to admin if not provided
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        school: school.name,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// ----------------------
// LOGIN
// ----------------------
router.post("/login", async (req, res) => {
  try {
    const { email, password, school: schoolName } = req.body;

    if (!email || !password || !schoolName) {
      return res.status(400).json({ message: "Email, password, and school are required" });
    }

    // 1️⃣ Find the school first
    const school = await School.findOne({ name: schoolName });
    if (!school) return res.status(400).json({ message: "School not found" });

    // 2️⃣ Find the user in that school
    const user = await User.findOne({ email, school: school._id });
    if (!user) return res.status(400).json({ message: "User not found in this school" });

    // 3️⃣ Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    // 4️⃣ Create JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        school: school.name,
      },
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

export default router;