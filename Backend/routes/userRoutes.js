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

// GET all users
router.get("/", getUsers);

// CREATE user
router.post("/", createUser);

// GET single
router.get("/:id", getUser);

// UPDATE
router.put("/:id", updateUser);

// DELETE
router.delete("/:id", deleteUser);

export default router;