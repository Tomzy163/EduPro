import express from "express";
import {
  linkParentToStudent,
  getParentWithChildren,
  getStudentWithParents,
  getLinkHistory,
} from "../controllers/relationshipController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/link", protect, authorize("admin"), linkParentToStudent);

router.get("/parent/:id", protect, getParentWithChildren);
router.get("/student/:id", protect, getStudentWithParents);
router.get("/history", protect, authorize("admin"), getLinkHistory);

export default router;