// models/Timetable.js
import mongoose from "mongoose";

const timetableSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  day: { type: String, required: true },
  time: { type: String, required: true },
});

export default mongoose.model("Timetable", timetableSchema);