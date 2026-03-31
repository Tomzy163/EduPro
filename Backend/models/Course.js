import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    school: {
      type: String,
      required: true,
    },
    name: { type: String, required: true },

    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    term: {
      type: String,
      enum: ["First Term", "Second Term", "Third Term"],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Course", courseSchema);