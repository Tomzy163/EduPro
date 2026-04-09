// models/Timetable.js
import mongoose from "mongoose";

const timetableSchema = new mongoose.Schema({
  class: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },

  day: { type: String, required: true },
  time: { type: String, required: true },
});

export default mongoose.model("Timetable", timetableSchema);