// backend/routes/userRoutes.js
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

// All routes here are protected and require admin role
router.use(protect, authorize("admin"));

// // Get all users in the same school
// router.get("/users", getUsers);
// GET all users for the school
router.get("/", protect, getUsers);

// Create a new user in admin's school
router.post("/users", createUser);

// Get single user by ID (admin only, same school)
router.get("/users/:id", getUser);

// Update user info (admin only, same school)
router.put("/users/:id", updateUser);

// Delete user (admin only, same school)
router.delete("/users/:id", deleteUser);

export default router;