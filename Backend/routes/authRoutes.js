import express from "express";
import {
  loginUser,
  register,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";

const router = express.Router();

console.log("✅ authRoutes loaded");

// ROUTES
router.post("/register", register);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.post("/forgot-password", (req, res, next) => {
  console.log("🔥 HIT forgot-password route");
  next();
}, forgotPassword);

export default router;