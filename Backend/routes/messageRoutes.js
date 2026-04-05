import express from "express";
import {
  sendMessage,
  getMessages,
  updateMessage,
  deleteMessage,
  deleteAllMessages,
} from "../controllers/messageController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Admin sends message
router.post("/", protect, authorize("admin"), sendMessage);

// All users receive messages
router.get("/", protect, getMessages);

// Admin updates message
router.put("/:id", protect, authorize("admin"), updateMessage);

// Admin deletes message
router.delete("/:id", protect, authorize("admin"), deleteMessage);

// Admin deletes all messages
router.delete("/", protect, authorize("admin"), deleteAllMessages);

export default router;