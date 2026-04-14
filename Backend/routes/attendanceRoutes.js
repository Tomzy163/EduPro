import express from "express";
import {
  markAttendance,
  getAttendance,
  getAttendanceList,
} from "../controllers/attendanceController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/", protect, authorize("teacher", "admin"), markAttendance);
router.get("/", protect, authorize("teacher", "admin"), getAttendanceList);
router.get("/student/:id", protect, getAttendance);

export default router;
