import express from "express";
import {
  createCourse,
  getCourses,
  assignStudent,
  assignTeacher,
} from "../controllers/courseController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

// ADMIN
router.post("/", protect, authorize("admin"), createCourse);
router.get("/", protect, getCourses);

router.post("/assign-student", protect, authorize("admin"), assignStudent);
router.post("/assign-teacher", protect, authorize("admin"), assignTeacher);

export default router;