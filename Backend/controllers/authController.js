import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import School from "../models/School.js";
// import User from "../models/User.js";

// Generate token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// LOGIN
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  school: user.school, // ✅ IMPORTANT
  token: generateToken(user._id, user.role),
});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// REGISTER (Admin creates users)
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// export const register = async (req, res) => {
//   try {
//     const { name, email, password } = req.body;

//     // ❗ Check if admin already exists
//     const existingAdmin = await User.findOne({ role: "admin" });

//     if (existingAdmin) {
//       return res.status(403).json({
//         message: "Admin already exists. Contact admin.",
//       });
//     }

//     // ✅ HASH PASSWORD HERE
//     const hashedPassword = await bcrypt.hash(password, 10);
//       user.password = hashedPassword;
//     // ✅ CREATE ADMIN
//     const user = await User.create({
//       name,
//       email,
//       password: hashedPassword,
//       role: "admin",
//     });

//     res.status(201).json({
//       _id: user._id,
//       name: user.name,
//       role: user.role,
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };


export const register = async (req, res) => {
  try {
    const { name, email, password, schoolName } = req.body;

    // Check if school already exists
    const existingSchool = await School.findOne({ name: schoolName });

    if (existingSchool) {
      return res.status(400).json({
        message: "School already registered. Please login.",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin
    const admin = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "admin",
    });

    // Create school
    const school = await School.create({
      name: schoolName,
      admin: admin._id,
    });

    // Link admin to school
    admin.school = school._id;
    await admin.save();

    res.status(201).json({
      message: "School registered successfully",
      admin,
      school,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const checkAdminExists = async (req, res) => {
  try {
    const admin = await User.findOne({ role: "admin" });
    res.json({ exists: !!admin });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};


// import crypto from "crypto";
// import User from "../models/User.js";

// FORGOT PASSWORD
export const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) return res.status(404).json({ message: "User not found" });

    const resetToken = crypto.randomBytes(20).toString("hex");

    user.resetToken = resetToken;
    user.resetTokenExpire = Date.now() + 10 * 60 * 1000; // 10 mins

    await user.save();

    res.json({
      message: "Reset token generated",
      token: resetToken, // later send via email
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
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

    user.password = password; // make sure hashing runs
    user.resetToken = undefined;
    user.resetTokenExpire = undefined;

    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};