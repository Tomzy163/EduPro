import express from "express";
import {
  uploadResult,
  updateResult,
  deleteResult,
  deleteResults,
  getTeacherResults,
  getStudentResults,
} from "../controllers/resultController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import {
  requirePlanFeature,
  requireSchoolAccess,
} from "../middleware/subscriptionMiddleware.js";

const router = express.Router();

router.use(protect, requireSchoolAccess);
router.use(requirePlanFeature("result_tracking"));

router.post("/", authorize("teacher", "admin"), uploadResult);
router.delete("/bulk-delete", authorize("teacher", "admin"), deleteResults);
router.put("/:id", authorize("teacher", "admin"), updateResult);
router.delete("/:id", authorize("teacher", "admin"), deleteResult);
router.get("/teacher", authorize("teacher", "admin"), getTeacherResults);
router.get("/student/:id", getStudentResults);

export default router;
