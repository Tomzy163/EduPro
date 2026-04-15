import mongoose from "mongoose";

const linkSchema = new mongoose.Schema(
  {
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
    },
    linkedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // admin
    },
  },
  { timestamps: true }
);

linkSchema.index({ school: 1, parent: 1, student: 1 }, { unique: true });
linkSchema.index({ school: 1, student: 1, createdAt: -1 });

export default mongoose.model("ParentStudentLink", linkSchema);
