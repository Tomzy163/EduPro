import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    school: {
  type: String,
  required: true,
},
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },

    status: {
      type: String,
      enum: ["present", "absent"],
    },

    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Attendance", attendanceSchema);