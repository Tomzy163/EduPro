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

timetableSchema.index({ school: 1, audience: 1, day: 1, time: 1 });
timetableSchema.index({ school: 1, teacher: 1, day: 1, time: 1 });
timetableSchema.index({ school: 1, student: 1, day: 1, time: 1 });

export default mongoose.model("Timetable", timetableSchema);
