import {
  linkParentToStudent,
  getParentWithChildren,
  getStudentWithParents,
  getLinkHistory,
  deleteLink,
  deleteAllLinks,
  updateLink
} from "../controllers/relationshipController.js";

router.post("/link", protect, authorize("admin"), linkParentToStudent);

router.get("/history", protect, authorize("admin"), getLinkHistory);

router.get("/parent/:id", protect, getParentWithChildren);
router.get("/student/:id", protect, getStudentWithParents);

// ✅ NEW
router.delete("/:id", protect, authorize("admin"), deleteLink);
router.delete("/", protect, authorize("admin"), deleteAllLinks);
router.put("/:id", protect, authorize("admin"), updateLink);

export default router;