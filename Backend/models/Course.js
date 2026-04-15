import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
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

courseSchema.index({ school: 1, teacher: 1 });
courseSchema.index({ school: 1, term: 1, name: 1 });

export default mongoose.model("Course", courseSchema);
