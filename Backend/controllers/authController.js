import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import School from "../models/School.js";
import Payment from "../models/Payment.js";
import { SUBSCRIPTION_PLANS, getSubscriptionSnapshot } from "../utils/subscription.js";
import { sendEmail, sendPasswordResetEmail } from "../utils/mailer.js";
import { sendSms } from "../utils/sms.js";

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const normalizePhoneNumber = (value = "") => String(value || "").trim();

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

const buildSchoolPayload = (school) => ({
  _id: school._id,
  name: school.name,
  bankName: school.bankName || "",
  accountName: school.accountName || "",
  accountNumber: school.accountNumber || "",
  paymentInstructions: school.paymentInstructions || "",
  subscription: getSubscriptionSnapshot(school),
});

const buildAuthResponse = (user, school) => {
  const subscription = getSubscriptionSnapshot(school);
  const schoolPayload = buildSchoolPayload(school);

  return {
    user: {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber || "",
      role: user.role,
      school: school.name,
      schoolId: school._id,
      subscription,
    },
    school: schoolPayload,
    subscription,
    token: generateToken(user),
  };
};

export const register = async (req, res) => {
  try {
    const { name, email, phoneNumber, password, school: schoolName } = req.body;

    if (!schoolName) {
      return res.status(400).json({ message: "School is required" });
    }

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
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
      phoneNumber: normalizePhoneNumber(phoneNumber),
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
    const { name, email, phoneNumber, password, role } = req.body;

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
      phoneNumber: normalizePhoneNumber(phoneNumber),
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
    const { email, phoneNumber, school } = req.body;

    if ((!email && !phoneNumber) || !school) {
      return res.status(400).json({
        message: "School and either an email address or phone number are required",
      });
    }

    const schoolDoc = await School.findOne({
      name: { $regex: `^${escapeRegex(school.trim())}$`, $options: "i" },
    });
    if (!schoolDoc) return res.status(404).json({ message: "School not found" });

    const userQuery = {
      school: schoolDoc._id,
      $or: [],
    };

    if (email) {
      userQuery.$or.push({ email: email.toLowerCase() });
    }

    if (phoneNumber) {
      userQuery.$or.push({ phoneNumber: normalizePhoneNumber(phoneNumber) });
    }

    const user = await User.findOne(userQuery);
    if (!user) return res.status(404).json({ message: "User not found in this school" });

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetTokenExpire = Date.now() + 15 * 60 * 1000;
    await user.save();

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const resetLink = `${clientUrl}/reset-password?token=${encodeURIComponent(token)}`;

    let emailSent = false;
    let smsSent = false;

    if (email && user.email) {
      try {
        const emailResult = await sendPasswordResetEmail({
          to: user.email,
          name: user.name,
          resetLink,
        });
        emailSent = emailResult.sent;
      } catch (mailError) {
        console.error("FORGOT PASSWORD MAIL ERROR:", mailError);
      }
    }

    if (phoneNumber && user.phoneNumber) {
      try {
        const smsResult = await sendSms({
          to: user.phoneNumber,
          body: `EduPro password reset: ${resetLink} (expires in 15 minutes).`,
        });
        smsSent = smsResult.sent;
      } catch (smsError) {
        console.error("FORGOT PASSWORD SMS ERROR:", smsError);
      }
    }

    if (emailSent || smsSent) {
      return res.json({
        message:
          emailSent && smsSent
            ? "Reset link sent through email and SMS."
            : emailSent
              ? "Reset link sent to your email."
              : "Reset link sent to your phone number by SMS.",
        emailSent,
        smsSent,
      });
    }

    res.json({
      message:
        "Reset link generated successfully. Email or SMS delivery is not configured or failed on this device, so use the link below while testing locally.",
      resetLink,
      emailSent,
      smsSent,
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
      school: buildSchoolPayload(school),
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

    if (!req.file) {
      return res.status(400).json({ message: "Upload payment proof before activating a plan" });
    }

    school.currentPlan = plan;
    school.subscriptionStatus = "active";
    school.subscriptionStartedAt = school.subscriptionStartedAt || new Date();
    school.subscribedAt = new Date();

    await school.save();

    await Payment.create({
      user: req.user._id,
      amount: SUBSCRIPTION_PLANS[plan]?.price || 0,
      receipt: req.file.path,
      school: school._id,
      status: "approved",
      type: "subscription",
      plan,
      description: `${SUBSCRIPTION_PLANS[plan]?.name || plan} subscription`,
      confirmedAt: new Date(),
    });

    const subscription = getSubscriptionSnapshot(school);

    if (req.user.email) {
      try {
        await sendEmail({
          to: req.user.email,
          subject: "EduPro subscription activated",
          text: `Your ${SUBSCRIPTION_PLANS[plan]?.name || plan} subscription is now active for ${school.name}.`,
        });
      } catch (error) {
        console.error("SUBSCRIPTION EMAIL ERROR:", error);
      }
    }

    if (req.user.phoneNumber) {
      try {
        await sendSms({
          to: req.user.phoneNumber,
          body: `EduPro: ${SUBSCRIPTION_PLANS[plan]?.name || plan} is now active for ${school.name}.`,
        });
      } catch (error) {
        console.error("SUBSCRIPTION SMS ERROR:", error);
      }
    }

    req.app.get("io")?.emit("subscriptionUpdated");

    res.json({
      message: `${plan[0].toUpperCase()}${plan.slice(1)} plan activated successfully.`,
      school: buildSchoolPayload(school),
      subscription,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
