import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      default: null,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    role: {
      type: String,
      default: "",
      trim: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    entityType: {
      type: String,
      default: "system",
      trim: true,
    },
    entityId: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["success", "failed", "blocked"],
      default: "success",
    },
    ipAddress: {
      type: String,
      default: "",
      trim: true,
    },
    userAgent: {
      type: String,
      default: "",
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

auditLogSchema.index({ school: 1, createdAt: -1 });
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

export default mongoose.model("AuditLog", auditLogSchema);
