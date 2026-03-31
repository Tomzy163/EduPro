import express from "express";
import {
  uploadResult,
  getStudentResults,
} from "../controllers/resultController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Teacher & Admin
router.post("/", protect, authorize("teacher", "admin"), uploadResult);

// Student / Parent / Admin
router.get("/student/:id", protect, getStudentResults);

export default router;