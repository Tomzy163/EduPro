import express from "express";
import {
  getDashboardSummary,
  getMySchool,
  updateMySchool,
} from "../controllers/schoolController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import {
  requirePlanFeature,
  requireSchoolAccess,
} from "../middleware/subscriptionMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getMySchool);
router.put("/", authorize("admin"), updateMySchool);
router.get(
  "/dashboard-summary",
  authorize("admin"),
  requireSchoolAccess,
  requirePlanFeature("reporting_workflow"),
  getDashboardSummary
);

export default router;
