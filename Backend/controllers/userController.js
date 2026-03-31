// backend/controllers/userController.js
import User from "../models/User.js";
import bcrypt from "bcryptjs";

/* =========================
   REGISTER ADMIN (NEW SCHOOL)
========================= */
export const registerUser = async (req, res) => {
  try {

    console.log("Incoming data:", req.body); // 👈 ADD THIS

    const { name, email, password, school } = req.body;
    if (!school) {
      return res.status(400).json({ message: "School is required" });
    }

    const existingUser = await User.findOne({ email, school });
    if (existingUser) {
      return res.status(400).json({ message: "Admin already exists for this school" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "admin",
      school,
    });

    res.status(201).json({ message: "Admin registered successfully", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   GET USERS (SAME SCHOOL)
========================= */
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({
      school: req.user.school,
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
      school: req.user.school,
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists in this school" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      school: req.user.school,
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