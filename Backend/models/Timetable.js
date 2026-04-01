import mongoose from "mongoose";

const TimetableSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  day: String,
  time: String,
});