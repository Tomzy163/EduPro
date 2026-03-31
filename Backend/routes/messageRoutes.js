import express from "express";
import {
  sendMessage,
  getMessages,
} from "../controllers/messageController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Admin sends message
router.post("/", protect, authorize("admin"), sendMessage);

// All users receive messages
router.get("/", protect, getMessages);

export default router;