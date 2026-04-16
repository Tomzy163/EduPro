import Message from "../models/Message.js";
import User from "../models/User.js";
import { sendEmail } from "../utils/mailer.js";
import { io, users } from "../utils/socketState.js";

const VALID_ROLE_TARGETS = new Set(["admin", "teacher", "student", "parent", "all"]);

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const buildEmailHtml = ({
  title,
  content,
  recipientName,
  senderName,
  senderRole,
  schoolName,
}) => `
  <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
    <h2>${escapeHtml(title)}</h2>
    <p>Hello ${escapeHtml(recipientName)},</p>
    <p>${escapeHtml(content).replace(/\n/g, "<br />")}</p>
    <p style="margin-top: 20px; color: #475569;">
      Sent by ${escapeHtml(senderName)} (${escapeHtml(senderRole)}) at ${escapeHtml(schoolName)}.
    </p>
  </div>
`;

const deliverRealtimeMessage = ({ userId, title, content }) => {
  const activeConnections = users.filter(
    (user) => user.userId?.toString() === userId?.toString()
  );

  activeConnections.forEach(({ socketId }) => {
    io?.to(socketId).emit("newMessage", { title, content });
  });
};

export const sendMessage = async (req, res) => {
  try {
    const title = String(req.body.title || "").trim();
    const content = String(req.body.content || "").trim();
    const roleTarget = String(req.body.roleTarget || "all")
      .trim()
      .toLowerCase();

    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required." });
    }

    if (!VALID_ROLE_TARGETS.has(roleTarget)) {
      return res.status(400).json({ message: "Select a valid announcement target." });
    }

    const schoolId = req.user.school._id;
    const query =
      roleTarget === "all"
        ? { school: schoolId }
        : { school: schoolId, role: roleTarget };

    const recipients = await User.find(query).select("_id name email role");
    const senderRecipient = {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    };

    const uniqueRecipients = Array.from(
      new Map(
        [...recipients, senderRecipient].map((user) => [
          user._id.toString(),
          user,
        ])
      ).values()
    );

    const message = await Message.create({
      title,
      content,
      sender: req.user._id,
      recipients: uniqueRecipients.map((user) => user._id),
      roleTarget,
      school: schoolId,
    });

    uniqueRecipients.forEach((user) => {
      deliverRealtimeMessage({
        userId: user._id,
        title,
        content,
      });
    });

    await Promise.allSettled(
      uniqueRecipients
        .filter((user) => user.email)
        .map((user) =>
          sendEmail({
            to: user.email,
            subject: `[EduPro] ${title}`,
            text: `Hello ${user.name},\n\n${content}\n\nSent by ${req.user.name} (${req.user.role}) at ${req.user.school.name}.`,
            html: buildEmailHtml({
              title,
              content,
              recipientName: user.name,
              senderName: req.user.name,
              senderRole: req.user.role,
              schoolName: req.user.school.name,
            }),
          })
        )
    );

    res.json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      recipients: req.user._id,
      school: req.user.school._id,
    })
      .populate("sender", "name email")
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.school.toString() !== req.user.school._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await Message.deleteOne({ _id: message._id });
    res.json({ message: "Message deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const updateMessage = async (req, res) => {
  try {
    const { title, content } = req.body;
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

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
