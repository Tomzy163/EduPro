// backend/routes/userRoutes.js
import express from "express";
import {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  linkParentToStudent,
  assignTeacher,
  assignStudent,
  getStudentsWithCourses,
  getTeachersWithCourses,
} from "../controllers/userController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

// All routes protected
router.use(protect);

// ADMIN ONLY ROUTES
router.get("/", authorize("admin"), getUsers);
router.post("/", authorize("admin"), createUser);

router.get("/:id", authorize("admin"), getUser);
router.put("/:id", authorize("admin"), updateUser);
router.delete("/:id", authorize("admin"), deleteUser);

// ADVANCED FEATURES
router.post("/link-parent", authorize("admin"), linkParentToStudent);
router.post("/assign-teacher", authorize("admin"), assignTeacher);
router.post("/assign-course", authorize("admin"), assignStudent);

// ANALYTICS
router.get("/students-with-courses", authorize("admin"), getStudentsWithCourses);
router.get("/teachers-with-courses", authorize("admin"), getTeachersWithCourses);

export default router;