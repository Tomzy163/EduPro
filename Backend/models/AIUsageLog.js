import mongoose from "mongoose";

const toMonthKey = (value = new Date()) => {
  const date = new Date(value);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
};

const aiUsageLogSchema = new mongoose.Schema(
  {
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "teacher", "student", "parent"],
      required: true,
    },
    plan: {
      type: String,
      default: "trial",
      trim: true,
    },
    feature: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["success", "failed", "blocked"],
      default: "success",
    },
    monthKey: {
      type: String,
      default: () => toMonthKey(),
      trim: true,
    },
    requestCharacters: {
      type: Number,
      default: 0,
      min: 0,
    },
    responseCharacters: {
      type: Number,
      default: 0,
      min: 0,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

aiUsageLogSchema.pre("validate", function syncMonthKey() {
  if (!this.monthKey) {
    this.monthKey = toMonthKey(this.createdAt || new Date());
  }
});

aiUsageLogSchema.index({ school: 1, user: 1, monthKey: 1, createdAt: -1 });
aiUsageLogSchema.index({ school: 1, user: 1, feature: 1, monthKey: 1 });
aiUsageLogSchema.index({ school: 1, feature: 1, monthKey: 1 });

export default mongoose.model("AIUsageLog", aiUsageLogSchema);
