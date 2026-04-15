import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
      school: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "School",
  required: true,
},
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

messageSchema.index({ school: 1, roleTarget: 1, createdAt: -1 });
messageSchema.index({ school: 1, sender: 1, createdAt: -1 });

export default mongoose.model("Message", messageSchema);
