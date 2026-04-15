import mongoose from "mongoose";

const schoolSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    currentPlan: {
      type: String,
      enum: ["trial", "normal", "supreme", "gold", "platinum"],
      default: "trial",
    },
    subscriptionStatus: {
      type: String,
      enum: ["trial", "active", "expired"],
      default: "trial",
    },
    trialStartedAt: {
      type: Date,
      default: Date.now,
    },
    trialEndsAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    subscriptionStartedAt: {
      type: Date,
      default: null,
    },
    subscribedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

schoolSchema.index({ currentPlan: 1, subscriptionStatus: 1 });

const School = mongoose.model("School", schoolSchema);

export default School;
