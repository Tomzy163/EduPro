// backend/controllers/messageController.js
import Message from "../models/Message.js";
import User from "../models/User.js";
import { io, users } from "../server.js";

// SEND MESSAGE (Admin)
export const sendMessage = async (req, res) => {
  try {
    const { title, content, roleTarget } = req.body;

    let recipients = [];

    if (roleTarget === "all") {
      // Send to all users in the same school
      recipients = await User.find({ school: req.user.school._id }).select("_id");
    } else {
      // Send to specific role
      recipients = await User.find({ role: roleTarget, school: req.user.school._id }).select("_id");
    }

    // Save message in DB
    const message = await Message.create({
      title,
      content,
      sender: req.user._id,
      recipients: recipients.map(u => u._id),
      roleTarget,
      school: req.user.school._id,
    });

    // Emit via socket
    recipients.forEach(user => {
      const found = users.find(u => u.userId.toString() === user._id.toString());
      if (found) {
        io.to(found.socketId).emit("newMessage", { title, content });
      }
    });

    res.json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// GET USER MESSAGES
export const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      recipients: req.user.id,        // Only messages for this user
      school: req.user.school._id,        // Only messages in same school
    })
      .populate("sender", "name email")
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// DELETE MESSAGE (Admin)
export const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Optional: ensure admin can only delete messages from their school
    if (message.school.toString() !== req.user.school.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await message.remove();
    res.json({ message: "Message deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// UPDATE MESSAGE
export const updateMessage = async (req, res) => {
  try {
    const { title, content } = req.body;

    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Only sender can edit
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    message.title = title || message.title;
    message.content = content || message.content;

    await message.save();

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE ALL SENT MESSAGES
export const deleteAllMessages = async (req, res) => {
  try {
    await Message.deleteMany({
      sender: req.user._id,
      school: req.user.school._id,
    });

    res.json({ message: "All messages deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};