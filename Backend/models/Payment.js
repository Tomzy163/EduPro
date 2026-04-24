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
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    amount: Number,

    currency: {
      type: String,
      default: "NGN",
      trim: true,
    },

    reference: {
      type: String,
      default: null,
      trim: true,
    },

    receipt: String,
    receiptNumber: {
      type: String,
      default: "",
      trim: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    studentNameSnapshot: {
      type: String,
      default: "",
      trim: true,
    },
    schoolNameSnapshot: {
      type: String,
      default: "",
      trim: true,
    },
    schoolCodeSnapshot: {
      type: String,
      default: "",
      trim: true,
    },

    gateway: {
      type: String,
      enum: ["manual", "paystack"],
      default: "manual",
    },

    gatewayStatus: {
      type: String,
      default: "",
      trim: true,
    },

    type: {
      type: String,
      enum: ["school_fee", "subscription"],
      default: "school_fee",
    },

    plan: {
      type: String,
      enum: ["normal", "supreme", "gold", "platinum", null],
      default: null,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["initiated", "pending", "success", "failed", "approved", "rejected"],
      default: "pending",
    },

    confirmedAt: {
      type: Date,
      default: null,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    customerEmail: {
      type: String,
      default: "",
      trim: true,
    },

    channel: {
      type: String,
      default: "",
      trim: true,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    webhookEvent: {
      type: String,
      default: "",
      trim: true,
    },

    activatedSubscription: {
      type: Boolean,
      default: false,
    },

    activationSkipped: {
      type: Boolean,
      default: false,
    },

    failureReason: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

paymentSchema.index({ school: 1, user: 1, createdAt: -1 });
paymentSchema.index({ school: 1, student: 1, createdAt: -1 });
paymentSchema.index({ school: 1, status: 1, createdAt: -1 });
paymentSchema.index({ reference: 1 }, { unique: true, sparse: true });
paymentSchema.index({ receiptNumber: 1 }, { sparse: true });

export default mongoose.model("Payment", paymentSchema);
