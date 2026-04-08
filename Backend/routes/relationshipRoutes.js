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

router.post("/link", protect, linkParentToStudent);

router.get("/parent/:id", protect, getParentWithChildren);
router.get("/student/:id", protect, getStudentWithParents);
router.get("/history", protect, getLinkHistory);

router.delete("/:id", protect, deleteLink);
router.put("/:id", protect, updateLink);
router.delete("/", protect, deleteAllLinks);

export default router;