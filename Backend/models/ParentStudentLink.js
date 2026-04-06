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

export default mongoose.model("ParentStudentLink", linkSchema);