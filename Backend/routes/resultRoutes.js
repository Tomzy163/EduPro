import express from "express";
import {
  uploadResult,
  updateResult,
  deleteResult,
  getTeacherResults,
  getStudentResults,
} from "../controllers/resultController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

// ✅ CREATE
router.post("/", protect, authorize("teacher", "admin"), uploadResult);

// ✅ UPDATE
router.put("/:id", protect, authorize("teacher", "admin"), updateResult);

// ✅ DELETE
router.delete("/:id", protect, authorize("teacher", "admin"), deleteResult);

// ✅ TEACHER VIEW
router.get("/teacher", protect, authorize("teacher", "admin"), getTeacherResults);

// ✅ STUDENT VIEW
router.get("/student/:id", protect, getStudentResults);

export default router;