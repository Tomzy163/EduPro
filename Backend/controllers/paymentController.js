import Payment from "../models/Payment.js";
import { sendEmail } from "../utils/mailer.js";
import { sendSms } from "../utils/sms.js";

// UPLOAD PAYMENT (Parent / Student)
export const createPayment = async (req, res) => {
  try {
    const payment = await Payment.create({
      user: req.user._id,
      amount: req.body.amount,
      receipt: req.file?.path,
      school: req.user.school._id,
      type: "school_fee",
      description: "School fee payment",
    });

    req.app.get("io")?.emit("paymentUpdated");

    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL PAYMENTS (Admin)
export const getPayments = async (req, res) => {
  try {
    const payments = await Payment.find({
      school: req.user.school._id,
    })
      .populate("user", "name email phoneNumber role")
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// APPROVE / REJECT
export const updatePaymentStatus = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate(
      "user",
      "name email phoneNumber"
    );

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    payment.status = req.body.status;
    payment.confirmedAt = req.body.status === "approved" ? new Date() : null;

    await payment.save();

    req.app.get("io")?.emit("paymentUpdated");

    if (payment.user?.email) {
      try {
        await sendEmail({
          to: payment.user.email,
          subject: `EduPro payment ${payment.status}`,
          text: `Hello ${payment.user.name}, your ${
            payment.type === "subscription" ? "subscription" : "school fee"
          } payment has been ${payment.status}.`,
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
          } payment is ${payment.status}.`,
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

export const getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({
      school: req.user.school._id,
      user: req.user._id,
    })
      .populate("user", "name email phoneNumber role")
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
