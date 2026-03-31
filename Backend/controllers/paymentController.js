import Payment from "../models/Payment.js";

// UPLOAD PAYMENT (Parent / Student)
export const createPayment = async (req, res) => {
  try {
    const payment = await Payment.create({
      user: req.user.id,
      amount: req.body.amount,
      receipt: req.file?.path,
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
  school: req.user.school,
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