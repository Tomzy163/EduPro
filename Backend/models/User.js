import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },

    name: { 
      type: String, 
      required: true 
    },

    email: { 
      type: String, 
      required: true 
    },

    password: String,

    role: {
      type: String,
      enum: ["admin", "teacher", "student", "parent"],
      default: "student",
    },

    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    parents: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
    children: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    resetToken: String,
    resetTokenExpire: Date,
  },
  { timestamps: true }
);

userSchema.index({ email: 1, school: 1 }, { unique: true });
userSchema.index({ school: 1, role: 1, createdAt: -1 });
userSchema.index({ school: 1, name: 1 });

export default mongoose.model("User", userSchema);
