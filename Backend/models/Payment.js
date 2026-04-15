import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
        school: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "School",
  required: true,
},
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    amount: Number,

    receipt: String,

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

paymentSchema.index({ school: 1, user: 1, createdAt: -1 });
paymentSchema.index({ school: 1, status: 1, createdAt: -1 });

export default mongoose.model("Payment", paymentSchema);
