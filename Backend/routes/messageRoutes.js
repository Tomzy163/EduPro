import express from "express";
import {
  sendMessage,
  getMessages,
  updateMessage,
  deleteMessage,
  deleteAllMessages,
} from "../controllers/messageControllerV2.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import {
  requirePlanFeature,
  requireSchoolAccess,
} from "../middleware/subscriptionMiddleware.js";

const router = express.Router();

router.use(protect, requireSchoolAccess);
router.use(requirePlanFeature("priority_communication"));

router.post("/", authorize("admin"), sendMessage);
router.get("/", getMessages);
router.put("/:id", authorize("admin"), updateMessage);
router.delete("/:id", authorize("admin"), deleteMessage);
router.delete("/", authorize("admin"), deleteAllMessages);

export default router;
