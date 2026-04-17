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
router.use(requirePlanFeature("high_volume_operations"));

router.post("/link", authorize("admin"), linkParentToStudent);
router.get("/parent/:id", authorize("admin", "parent"), getParentWithChildren);
router.get("/student/:id", authorize("admin"), getStudentWithParents);
router.get("/history", authorize("admin"), getLinkHistory);
router.delete("/:id", authorize("admin"), deleteLink);
router.put("/:id", authorize("admin"), updateLink);
router.delete("/", authorize("admin"), deleteAllLinks);

export default router;
