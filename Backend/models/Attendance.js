import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    school: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "School",
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

attendanceSchema.index({ school: 1, course: 1, date: -1 });
attendanceSchema.index({ school: 1, student: 1, date: -1 });

export default mongoose.model("Attendance", attendanceSchema);
