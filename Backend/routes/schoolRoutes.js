import express from "express";
import {
  getDashboardSummary,
  getMySchool,
  uploadSchoolLogo,
  updateMySchool,
} from "../controllers/schoolController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { schoolLogoUpload } from "../middleware/uploadMiddleware.js";
import {
  requirePlanFeature,
  requireSchoolAccess,
} from "../middleware/subscriptionMiddleware.js";

const router = express.Router();

router.use(protect);
router.use(requireSchoolAccess);

router.get("/", getMySchool);
router.put("/", authorize("admin"), updateMySchool);
router.put("/logo", authorize("admin"), schoolLogoUpload.single("logo"), uploadSchoolLogo);
router.get(
  "/dashboard-summary",
  authorize("admin"),
  requirePlanFeature("reporting_workflow"),
  getDashboardSummary
);

export default router;
