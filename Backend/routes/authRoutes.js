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


export default router;