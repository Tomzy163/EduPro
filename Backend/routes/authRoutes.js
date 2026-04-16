import express from "express";
import {
  forgotPassword,
  getSubscriptionStatus,
  loginUser,
  paystackWebhook,
  register,
  resetPassword,
  subscribeSchool,
  verifySubscriptionPaymentStatus,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/paystack/webhook", paystackWebhook);
router.get("/subscription-status", protect, authorize("admin"), getSubscriptionStatus);
router.post("/subscribe", protect, authorize("admin"), subscribeSchool);
router.get(
  "/subscribe/verify",
  protect,
  authorize("admin"),
  verifySubscriptionPaymentStatus
);

export default router;
