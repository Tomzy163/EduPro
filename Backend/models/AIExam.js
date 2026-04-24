import mongoose from "mongoose";

const aiExamSchema = new mongoose.Schema(
  {
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    className: {
      type: String,
      required: true,
      trim: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    questionCount: {
      type: Number,
      required: true,
      min: 1,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
    },
    examContent: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: true }
);

aiExamSchema.index({ school: 1, createdBy: 1, createdAt: -1 });
aiExamSchema.index({ school: 1, subject: 1, className: 1, createdAt: -1 });

export default mongoose.model("AIExam", aiExamSchema);
