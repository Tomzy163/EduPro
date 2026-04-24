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
import { createRateLimiter } from "../middleware/rateLimitMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();
const authenticationRateLimiter = createRateLimiter({
  keyPrefix: "auth-login",
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: "Too many login attempts. Please wait a few minutes before trying again.",
  keyGenerator: (req) =>
    `${req.ip}:${String(req.body?.email || "").trim().toLowerCase()}`,
});
const recoveryRateLimiter = createRateLimiter({
  keyPrefix: "auth-recovery",
  windowMs: 15 * 60 * 1000,
  max: 5,
  message:
    "Too many password recovery attempts. Please wait a few minutes before trying again.",
  keyGenerator: (req) =>
    `${req.ip}:${String(req.body?.email || req.body?.phoneNumber || "").trim().toLowerCase()}`,
});
const registrationRateLimiter = createRateLimiter({
  keyPrefix: "auth-register",
  windowMs: 60 * 60 * 1000,
  max: 4,
  message:
    "Too many registration attempts from this device. Please wait before creating another school.",
});

router.post("/register", registrationRateLimiter, register);
router.post("/login", authenticationRateLimiter, loginUser);
router.post("/forgot-password", recoveryRateLimiter, forgotPassword);
router.post("/reset-password", recoveryRateLimiter, resetPassword);
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
