import mongoose from "mongoose";

const timetableSchema = new mongoose.Schema(
  {
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    audience: {
      type: String,
      enum: ["teacher", "student"],
      required: true,
    },
    day: {
      type: String,
      required: true,
      trim: true,
    },
    time: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Timetable", timetableSchema);
