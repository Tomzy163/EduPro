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

const router = express.Router();

router.post("/link", protect, authorize("admin"), linkParentToStudent);

router.get("/parent/:id", protect, authorize("admin", "parent"), getParentWithChildren);
router.get("/student/:id", protect, authorize("admin"), getStudentWithParents);
router.get("/history", protect, authorize("admin"), getLinkHistory);

router.delete("/:id", protect, authorize("admin"), deleteLink);
router.put("/:id", protect, authorize("admin"), updateLink);
router.delete("/", protect, authorize("admin"), deleteAllLinks);

export default router;
