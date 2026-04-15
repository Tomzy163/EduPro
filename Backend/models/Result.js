import mongoose from "mongoose";

const resultSchema = new mongoose.Schema(
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

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    score: Number,
    grade: String,

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

resultSchema.index({ school: 1, course: 1, createdAt: -1 });
resultSchema.index({ school: 1, student: 1, createdAt: -1 });
resultSchema.index({ school: 1, student: 1, course: 1 });

export default mongoose.model("Result", resultSchema);
