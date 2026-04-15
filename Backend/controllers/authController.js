import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import School from "../models/School.js";
import nodemailer from "nodemailer";
import { getSubscriptionSnapshot } from "../utils/subscription.js";

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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

const buildAuthResponse = (user, school) => {
  const subscription = getSubscriptionSnapshot(school);

  return {
    user: {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      school: school.name,
      schoolId: school._id,
      subscription,
    },
    school: {
      _id: school._id,
      name: school.name,
      subscription,
    },
    subscription,
    token: generateToken(user),
  };
};

export const register = async (req, res) => {
  try {
    const { name, email, password, school: schoolName } = req.body;

    if (!schoolName) {
      return res.status(400).json({ message: "School is required" });
    }

    let school = await School.findOne({
      name: { $regex: `^${escapeRegex(schoolName.trim())}$`, $options: "i" },
    });

    if (school) {
      return res.status(400).json({
        message: "School already exists. Please login.",
      });
    }

    school = await School.create({ name: schoolName.trim() });

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
      ...buildAuthResponse(admin, school),
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
      name: { $regex: `^${escapeRegex(schoolName.trim())}$`, $options: "i" },
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

    const subscription = getSubscriptionSnapshot(school);

    if (!subscription.hasAppAccess && user.role !== "admin") {
      return res.status(403).json({
        message:
          "This school's access has expired. Please contact the school admin to renew the subscription.",
        code: "SCHOOL_ACCESS_BLOCKED",
        subscription,
      });
    }

    if (!subscription.hasAppAccess && school.subscriptionStatus !== "expired") {
      school.subscriptionStatus = "expired";
      await school.save();
    }

    res.json(buildAuthResponse(user, school));
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

    if (!email || !school) {
      return res.status(400).json({ message: "Email and school are required" });
    }

    const schoolDoc = await School.findOne({
      name: { $regex: `^${escapeRegex(school.trim())}$`, $options: "i" },
    });
    if (!schoolDoc) return res.status(404).json({ message: "School not found" });

    const user = await User.findOne({
      email: email.toLowerCase(),
      school: schoolDoc._id,
    });
    if (!user) return res.status(404).json({ message: "User not found in this school" });

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetTokenExpire = Date.now() + 15 * 60 * 1000;
    await user.save();

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const resetLink = `${clientUrl}/reset-password?token=${encodeURIComponent(token)}`;

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
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
        text: `Hello ${user.name},\n\nClick this link to reset your password:\n${resetLink}\nThis link expires in 15 minutes.`,
      };

      await transporter.sendMail(mailOptions);

      return res.json({ message: "Reset link sent to your email" });
    }

    res.json({
      message: "Reset link generated successfully.",
      resetLink,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: "Token and new password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

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

export const getSubscriptionStatus = async (req, res) => {
  try {
    const school = await School.findById(req.user.school._id || req.user.school);

    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }

    const subscription = getSubscriptionSnapshot(school);

    if (!subscription.hasAppAccess && school.subscriptionStatus !== "expired") {
      school.subscriptionStatus = "expired";
      await school.save();
    }

    res.json({
      school: {
        _id: school._id,
        name: school.name,
      },
      subscription,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const subscribeSchool = async (req, res) => {
  try {
    const { plan } = req.body;

    if (!["normal", "supreme", "gold", "platinum"].includes(plan)) {
      return res.status(400).json({ message: "Select a valid subscription plan" });
    }

    const school = await School.findById(req.user.school._id || req.user.school);

    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }

    school.currentPlan = plan;
    school.subscriptionStatus = "active";
    school.subscriptionStartedAt = school.subscriptionStartedAt || new Date();
    school.subscribedAt = new Date();

    await school.save();

    const subscription = getSubscriptionSnapshot(school);

    res.json({
      message: `${plan[0].toUpperCase()}${plan.slice(1)} plan activated successfully.`,
      school: {
        _id: school._id,
        name: school.name,
      },
      subscription,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
