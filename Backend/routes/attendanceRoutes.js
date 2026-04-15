import express from "express";
import {
  markAttendance,
  getAttendance,
  getAttendanceList,
} from "../controllers/attendanceController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { requireSchoolAccess } from "../middleware/subscriptionMiddleware.js";

const router = express.Router();

router.use(protect, requireSchoolAccess);

router.post("/", authorize("teacher", "admin"), markAttendance);
router.get("/", authorize("teacher", "admin"), getAttendanceList);
router.get("/student/:id", getAttendance);

export default router;
