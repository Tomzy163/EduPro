import express from "express";
import {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

// 🔐 Protect all routes
router.use(protect, authorize("admin"));

// ✅ GET ALL USERS → /api/users
router.get("/", getUsers);

// ✅ CREATE USER → /api/users
router.post("/", createUser);

// ✅ GET SINGLE USER → /api/users/:id
router.get("/:id", getUser);

// ✅ UPDATE USER → /api/users/:id
router.put("/:id", updateUser);

// ✅ DELETE USER → /api/users/:id
router.delete("/:id", deleteUser);

export default router;