import express from "express";
import {
  createCourse,
  getCourses,
  assignStudent,
  assignTeacher,
} from "../controllers/courseController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { requireSchoolAccess } from "../middleware/subscriptionMiddleware.js";

const router = express.Router();

router.use(protect, requireSchoolAccess);

router.post("/", authorize("admin"), createCourse);
router.get("/", getCourses);
router.post("/assign-student", authorize("admin"), assignStudent);
router.post("/assign-teacher", authorize("admin"), assignTeacher);

export default router;
