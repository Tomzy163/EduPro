import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    title: String,
    content: String,

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    recipients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    roleTarget: {
      type: String, // "student", "teacher", "parent", "all"
    },
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);