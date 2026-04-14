import Payment from "../models/Payment.js";

// UPLOAD PAYMENT (Parent / Student)
export const createPayment = async (req, res) => {
  try {
    const payment = await Payment.create({
      user: req.user._id,
      amount: req.body.amount,
      receipt: req.file?.path,
      school: req.user.school._id, // add school
    });

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
      .populate("user", "name email role");

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// APPROVE / REJECT
export const updatePaymentStatus = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    payment.status = req.body.status;

    await payment.save();

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
      .populate("user", "name email role")
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
