import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import School from "../models/School.js";
import Payment from "../models/Payment.js";
import { SUBSCRIPTION_PLANS, getSubscriptionSnapshot } from "../utils/subscription.js";
import { isMailerConfigured, sendPasswordResetEmail } from "../utils/mailer.js";
import { sendSms } from "../utils/sms.js";
import {
  generatePaystackReference,
  initializePaystackTransaction,
  verifyPaystackSignature,
  verifyPaystackTransaction,
} from "../utils/paystack.js";
import {
  activateSubscriptionFromPayment,
  isValidSubscriptionPlan,
} from "../utils/subscriptionActivation.js";

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const normalizePhoneNumber = (value = "") => String(value || "").trim();
const SUBSCRIPTION_CURRENCY = process.env.PAYSTACK_CURRENCY || "NGN";
const PAYSTACK_SUCCESS_STATUSES = new Set(["success", "successful"]);
const isPaystackConfigured = () => Boolean(process.env.PAYSTACK_SECRET_KEY);

const resolveServerBaseUrl = () =>
  (process.env.SERVER_URL ||
    process.env.API_BASE_URL ||
    `http://localhost:${process.env.PORT || 3000}`).replace(/\/+$/, "");

const normalizePlan = (value = "") => String(value || "").trim().toLowerCase();

const syncExpiredSubscription = async (school) => {
  const subscription = getSubscriptionSnapshot(school);

  if (!subscription.hasAppAccess && school.subscriptionStatus !== "expired") {
    school.subscriptionStatus = "expired";
    await school.save();
  }

  return subscription;
};

const extractMetadataValue = (metadata, key) => {
  if (!metadata || typeof metadata !== "object") {
    return "";
  }

  const directValue =
    metadata[key] ??
    metadata[key.toLowerCase()] ??
    metadata[key.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`)];

  if (directValue) {
    return directValue;
  }

  const customField = Array.isArray(metadata.custom_fields)
    ? metadata.custom_fields.find((field) => {
        const variableName = String(field?.variable_name || "").toLowerCase();
        const displayName = String(field?.display_name || "").toLowerCase();
        const lookup = key.toLowerCase();

        return variableName === lookup || displayName === lookup;
      })
    : null;

  return customField?.value || "";
};

const extractSubscriptionPaymentContext = (payload = {}) => {
  const metadata = payload.metadata || {};

  return {
    metadata,
    userId:
      extractMetadataValue(metadata, "userId") ||
      extractMetadataValue(metadata, "user_id"),
    plan: normalizePlan(
      extractMetadataValue(metadata, "plan") ||
        extractMetadataValue(metadata, "planName")
    ),
    schoolId:
      extractMetadataValue(metadata, "schoolId") ||
      extractMetadataValue(metadata, "school_id"),
  };
};

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

    const subscription = await syncExpiredSubscription(school);

    if (!subscription.hasAppAccess && user.role !== "admin") {
      return res.status(403).json({
        message:
          "This school's access has expired. Please contact the school admin to renew the subscription.",
        code: "SCHOOL_ACCESS_BLOCKED",
        subscription,
      });
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
    let emailDeliveryMode = "";
    let emailPreviewUrl = "";
    let emailDeliveryFailed = false;
    const mailerConfigured = isMailerConfigured();

    if (email && user.email) {
      try {
        const emailResult = await sendPasswordResetEmail({
          to: user.email,
          name: user.name,
          resetLink,
        });
        emailSent = emailResult.sent;
        emailDeliveryMode = emailResult.mode || "";
        emailPreviewUrl = emailResult.previewUrl || "";
      } catch (mailError) {
        emailDeliveryFailed = true;
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

    if (email && mailerConfigured && !emailSent && emailDeliveryFailed && !smsSent) {
      return res.status(502).json({
        message:
          "The reset link was generated, but email delivery failed. Check your SMTP or SendGrid configuration and try again.",
      });
    }

    if (emailSent || smsSent) {
      return res.json({
        message:
          emailSent && emailDeliveryMode === "preview"
            ? "Reset email generated successfully and saved to the local mail preview."
            : emailSent && smsSent
            ? "Reset link sent through email and SMS."
            : emailSent
              ? "Reset link sent to your email."
              : "Reset link sent to your phone number by SMS.",
        emailSent,
        smsSent,
        emailDeliveryMode,
        previewUrl: emailPreviewUrl,
      });
    }

    res.json({
      message:
        "Reset link generated successfully. A real email or SMS provider is not configured on this device yet, so use the link below while testing locally.",
      resetLink,
      emailSent,
      smsSent,
      emailDeliveryMode,
      previewUrl: emailPreviewUrl,
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

    const subscription = await syncExpiredSubscription(school);

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
    const plan = normalizePlan(req.body.plan);

    if (!isValidSubscriptionPlan(plan)) {
      return res.status(400).json({ message: "Select a valid subscription plan" });
    }

    const school = await School.findById(req.user.school._id || req.user.school);

    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }

    if (!isPaystackConfigured()) {
      return res.status(503).json({
        message:
          "Paystack is not configured on the server yet. Add PAYSTACK_SECRET_KEY before starting a subscription payment.",
      });
    }

    const currentSubscription = await syncExpiredSubscription(school);

    if (
      currentSubscription.status === "active" &&
      currentSubscription.plan === plan &&
      currentSubscription.subscriptionEndsAt
    ) {
      return res.status(409).json({
        message: `The ${SUBSCRIPTION_PLANS[plan]?.name || plan} plan is already active until ${new Date(currentSubscription.subscriptionEndsAt).toLocaleDateString()}.`,
        subscription: currentSubscription,
      });
    }

    if (!req.user.email) {
      return res.status(400).json({
        message:
          "The admin account needs a valid email address before a Paystack subscription can be started.",
      });
    }

    const reference = generatePaystackReference(plan);
    const amount = Number(SUBSCRIPTION_PLANS[plan]?.price || 0);
    const callbackUrl =
      process.env.PAYSTACK_CALLBACK_URL ||
      `${process.env.CLIENT_URL || "http://localhost:5173"}/subscription`;
    const metadata = {
      userId: req.user._id.toString(),
      schoolId: school._id.toString(),
      schoolName: school.name,
      plan,
      planName: SUBSCRIPTION_PLANS[plan]?.name || plan,
      transactionType: "subscription",
    };

    const paystackResponse = await initializePaystackTransaction({
      email: req.user.email,
      amount: Math.round(amount * 100),
      currency: SUBSCRIPTION_CURRENCY,
      reference,
      callback_url: callbackUrl,
      metadata,
    });

    await Payment.create({
      user: req.user._id,
      amount,
      school: school._id,
      currency: SUBSCRIPTION_CURRENCY,
      reference,
      gateway: "paystack",
      gatewayStatus: "initialized",
      status: "initiated",
      type: "subscription",
      plan,
      description: `${SUBSCRIPTION_PLANS[plan]?.name || plan} subscription`,
      customerEmail: req.user.email,
      metadata,
    });

    res.json({
      message: "Secure Paystack checkout initialized. Redirecting now.",
      authorizationUrl: paystackResponse.data?.authorization_url || "",
      accessCode: paystackResponse.data?.access_code || "",
      reference,
      school: buildSchoolPayload(school),
      subscription: currentSubscription,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const verifySubscriptionPaymentStatus = async (req, res) => {
  try {
    if (!isPaystackConfigured()) {
      return res.status(503).json({
        message:
          "Paystack verification is not available because PAYSTACK_SECRET_KEY is not configured on the server.",
      });
    }

    const reference = String(
      req.query.reference || req.params.reference || ""
    ).trim();

    if (!reference) {
      return res.status(400).json({ message: "Payment reference is required." });
    }

    const verification = await verifyPaystackTransaction(reference);
    const transaction = verification.data;

    if (!transaction) {
      return res
        .status(404)
        .json({ message: "No Paystack transaction was found for this reference." });
    }

    if (!PAYSTACK_SUCCESS_STATUSES.has(String(transaction.status || "").toLowerCase())) {
      return res.status(400).json({
        message: "This Paystack transaction has not completed successfully yet.",
        paymentStatus: transaction.status,
      });
    }

    const { metadata, userId, plan, schoolId } = extractSubscriptionPaymentContext(
      transaction
    );

    if (!schoolId || !userId || !isValidSubscriptionPlan(plan)) {
      return res.status(400).json({
        message:
          "The successful payment is missing the subscription metadata required for activation.",
      });
    }

    const activation = await activateSubscriptionFromPayment({
      schoolId,
      userId,
      plan,
      amount: Number(transaction.amount || 0) / 100,
      reference: transaction.reference,
      currency: transaction.currency || SUBSCRIPTION_CURRENCY,
      gateway: "paystack",
      gatewayStatus: transaction.gateway_response || transaction.status,
      status: "success",
      metadata,
      customerEmail: transaction.customer?.email || "",
      paidAt: transaction.paid_at ? new Date(transaction.paid_at) : new Date(),
      channel: transaction.channel || "",
      webhookEvent: "verification.backup",
    });

    req.app.get("io")?.emit("subscriptionUpdated");

    res.json({
      message: activation.activated
        ? `${SUBSCRIPTION_PLANS[plan]?.name || plan} plan activated successfully.`
        : activation.skippedReason ||
          "Subscription payment has already been processed.",
      school: buildSchoolPayload(activation.school),
      subscription: activation.subscription,
      reference: transaction.reference,
      paymentStatus: transaction.status,
      activated: activation.activated,
    });
  } catch (error) {
    console.error("PAYSTACK VERIFY ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

export const paystackWebhook = async (req, res) => {
  try {
    if (!isPaystackConfigured()) {
      return res.status(503).json({
        message:
          "Paystack webhook handling is unavailable because PAYSTACK_SECRET_KEY is not configured on the server.",
      });
    }

    const signature = req.headers["x-paystack-signature"];
    const signatureIsValid = verifyPaystackSignature({
      rawBody: req.rawBody,
      signature,
    });

    if (!signatureIsValid) {
      return res.status(401).json({ message: "Invalid Paystack signature." });
    }

    const event = req.body;
    const eventName = String(event?.event || "").toLowerCase();
    const transaction = event?.data || {};

    if (eventName !== "charge.success") {
      if (eventName.startsWith("charge.") && transaction.reference) {
        await Payment.findOneAndUpdate(
          { reference: transaction.reference },
          {
            gatewayStatus: transaction.gateway_response || transaction.status || eventName,
            status: PAYSTACK_SUCCESS_STATUSES.has(String(transaction.status || "").toLowerCase())
              ? "success"
              : "failed",
            failureReason: transaction.gateway_response || "",
            webhookEvent: eventName,
          }
        );
      }

      return res.status(200).json({ received: true });
    }

    const { metadata, userId, plan, schoolId } = extractSubscriptionPaymentContext(
      transaction
    );

    if (!schoolId || !userId || !isValidSubscriptionPlan(plan)) {
      return res.status(400).json({
        message: "Missing required subscription metadata in Paystack webhook.",
      });
    }

    await activateSubscriptionFromPayment({
      schoolId,
      userId,
      plan,
      amount: Number(transaction.amount || 0) / 100,
      reference: transaction.reference,
      currency: transaction.currency || SUBSCRIPTION_CURRENCY,
      gateway: "paystack",
      gatewayStatus: transaction.gateway_response || transaction.status,
      status: "success",
      metadata,
      customerEmail: transaction.customer?.email || "",
      paidAt: transaction.paid_at ? new Date(transaction.paid_at) : new Date(),
      channel: transaction.channel || "",
      webhookEvent: eventName,
    });

    req.app.get("io")?.emit("subscriptionUpdated");

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("PAYSTACK WEBHOOK ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};
