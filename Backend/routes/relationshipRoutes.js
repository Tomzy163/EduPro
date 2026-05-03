import express from "express";
import {
  linkParentToStudent,
  getParentWithChildren,
  getStudentWithParents,
  getLinkHistory,
  deleteLink,
  deleteAllLinks,
  updateLink,
} from "../controllers/relationshipController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import {
  requirePlanFeature,
  requireSchoolAccess,
} from "../middleware/subscriptionMiddleware.js";

const router = express.Router();

router.use(protect, requireSchoolAccess);

router.post(
  "/link",
  authorize("admin"),
  requirePlanFeature("high_volume_operations"),
  linkParentToStudent
);
router.get("/parent/:id", authorize("admin", "parent"), getParentWithChildren);
router.get(
  "/student/:id",
  authorize("admin"),
  requirePlanFeature("high_volume_operations"),
  getStudentWithParents
);
router.get(
  "/history",
  authorize("admin"),
  requirePlanFeature("high_volume_operations"),
  getLinkHistory
);
router.delete(
  "/:id",
  authorize("admin"),
  requirePlanFeature("high_volume_operations"),
  deleteLink
);
router.put(
  "/:id",
  authorize("admin"),
  requirePlanFeature("high_volume_operations"),
  updateLink
);
router.delete(
  "/",
  authorize("admin"),
  requirePlanFeature("high_volume_operations"),
  deleteAllLinks
);

export default router;
