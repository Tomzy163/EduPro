import express from "express";
import {
  register,          // Admin register (first time only)
  loginUser,         // Login
  registerUser,      // Admin creates users
  checkAdminExists,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";

const router = express.Router();

// ✅ Check if admin exists
router.get("/admin-exists", checkAdminExists);

// ✅ First admin registration ONLY
router.post("/register", register);

// ✅ Login
router.post("/login", loginUser);

// ✅ Admin creates users (teacher, student, parent)
router.post("/create-user", registerUser);

// ✅ Password reset
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;