import mongoose from "mongoose";

const aiMessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      default: "",
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const aiConversationSchema = new mongoose.Schema(
  {
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subject: {
      type: String,
      default: "",
      trim: true,
    },
    classLevel: {
      type: String,
      default: "",
      trim: true,
    },
    title: {
      type: String,
      default: "",
      trim: true,
    },
    messages: {
      type: [aiMessageSchema],
      default: [],
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

aiConversationSchema.index({ school: 1, student: 1, updatedAt: -1 });
aiConversationSchema.index({ school: 1, student: 1, subject: 1, updatedAt: -1 });

export default mongoose.model("AIConversation", aiConversationSchema);
