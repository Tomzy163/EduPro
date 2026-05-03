import Payment from "../models/Payment.js";
import ParentStudentLink from "../models/ParentStudentLink.js";
import User from "../models/User.js";
import { sendEmail } from "../utils/mailer.js";
import { sendSms } from "../utils/sms.js";

const buildReceiptNumber = () =>
  `EDU-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(
    1000 + Math.random() * 9000
  )}`;

const buildManualPaymentReference = () =>
  `manual-${Date.now()}-${Math.floor(100000 + Math.random() * 900000)}`;

const populatePayment = (query) =>
  query
    .populate("user", "name email phoneNumber role")
    .populate("student", "name email");

const resolvePaymentStudent = async (req) => {
  if (req.user.role === "student") {
    return req.user;
  }

  const studentId = String(req.body.studentId || "").trim();

  if (!studentId) {
    return null;
  }

  const linkedStudent = await ParentStudentLink.findOne({
    parent: req.user._id,
    student: studentId,
    school: req.user.school._id,
  });

  if (!linkedStudent) {
    return undefined;
  }

  return User.findOne({
    _id: studentId,
    role: "student",
    school: req.user.school._id,
  }).select("name email");
};

export const createPayment = async (req, res) => {
  try {
    const amount = Number(req.body.amount || 0);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: "Enter a valid payment amount." });
    }

    if (!req.file?.path) {
      return res.status(400).json({ message: "Upload an image or PDF receipt." });
    }

    const paymentStudent = await resolvePaymentStudent(req);

    if (req.user.role === "parent" && paymentStudent === null) {
      return res.status(400).json({ message: "Select the child this payment belongs to." });
    }

    if (req.user.role === "parent" && paymentStudent === undefined) {
      return res.status(403).json({ message: "You can only link payments to your own children." });
    }

    const receiptNumber = buildReceiptNumber();

    const payment = await Payment.create({
      user: req.user._id,
      student: paymentStudent?._id || null,
      amount,
      receipt: req.file.path.replace(/\\/g, "/"),
      receiptNumber,
      reference: buildManualPaymentReference(),
      school: req.user.school._id,
      schoolNameSnapshot: req.user.school.name || "",
      schoolCodeSnapshot: req.user.school.schoolCode || "",
      studentNameSnapshot: paymentStudent?.name || "",
      type: "school_fee",
      description: "School fee payment",
      status: "pending",
      gateway: "manual",
    });

    const populatedPayment = await populatePayment(
      Payment.findById(payment._id)
    );

    req.app.get("io")?.emit("paymentUpdated");

    res.status(201).json(populatedPayment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPayments = async (req, res) => {
  try {
    const payments = await populatePayment(
      Payment.find({
        school: req.user.school._id,
      }).sort({ createdAt: -1 })
    );

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const nextStatus = String(req.body.status || "").trim().toLowerCase();

    if (!["approved", "rejected"].includes(nextStatus)) {
      return res.status(400).json({ message: "Select a valid payment status." });
    }

    const payment = await populatePayment(
      Payment.findOne({
        _id: req.params.id,
        school: req.user.school._id,
      })
    );

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    payment.status = nextStatus;
    payment.confirmedAt = nextStatus === "approved" ? new Date() : null;
    payment.paidAt = nextStatus === "approved" ? new Date() : payment.paidAt;
    payment.approvedBy = req.user._id;

    await payment.save();

    req.app.get("io")?.emit("paymentUpdated");

    if (payment.user?.email) {
      try {
        await sendEmail({
          to: payment.user.email,
          subject: `EduPro payment ${payment.status}`,
          text: `Hello ${payment.user.name}, your ${
            payment.type === "subscription" ? "subscription" : "school fee"
          } payment has been ${payment.status}. Receipt number: ${payment.receiptNumber || "pending"}.`,
        });
      } catch (error) {
        console.error("PAYMENT EMAIL ERROR:", error);
      }
    }

    if (payment.user?.phoneNumber) {
      try {
        await sendSms({
          to: payment.user.phoneNumber,
          body: `EduPro: your ${
            payment.type === "subscription" ? "subscription" : "school fee"
          } payment is ${payment.status}. Receipt: ${payment.receiptNumber || "pending"}.`,
        });
      } catch (error) {
        console.error("PAYMENT SMS ERROR:", error);
      }
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findOneAndDelete({
      _id: req.params.id,
      school: req.user.school._id,
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    req.app.get("io")?.emit("paymentUpdated");
    res.json({ message: "Payment deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const clearPayments = async (req, res) => {
  try {
    await Payment.deleteMany({ school: req.user.school._id });
    req.app.get("io")?.emit("paymentUpdated");
    res.json({ message: "Payment history cleared successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyPayments = async (req, res) => {
  try {
    const payments = await populatePayment(
      Payment.find({
        school: req.user.school._id,
        user: req.user._id,
      }).sort({ createdAt: -1 })
    );

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
