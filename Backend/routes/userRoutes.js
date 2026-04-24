// backend/routes/userRoutes.js
import express from "express";
import {
  createUser,
  getMyProfile,
  getUsers,
  getUser,
  updateUser,
  updateMyProfile,
  deleteUser,
  linkParentToStudent,
  assignTeacher,
  assignStudent,
  getStudentsWithCourses,
  getTeachersWithCourses,
} from "../controllers/userControllerV2.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import {
  requirePlanFeature,
  requireSchoolAccess,
} from "../middleware/subscriptionMiddleware.js";

const router = express.Router();

// All routes protected
router.use(protect);
router.get("/profile", requireSchoolAccess, getMyProfile);
router.put("/profile", requireSchoolAccess, updateMyProfile);
router.use(requireSchoolAccess);

// ADMIN ONLY ROUTES
router.get("/", authorize("admin"), requirePlanFeature("user_management"), getUsers);
router.post("/", authorize("admin"), requirePlanFeature("user_management"), createUser);

// ADVANCED FEATURES
router.post("/link-parent", authorize("admin"), requirePlanFeature("high_volume_operations"), linkParentToStudent);
router.post("/assign-teacher", authorize("admin"), requirePlanFeature("course_setup"), assignTeacher);
router.post("/assign-course", authorize("admin"), requirePlanFeature("course_setup"), assignStudent);

// ANALYTICS
router.get("/students-with-courses", authorize("admin"), requirePlanFeature("reporting_workflow"), getStudentsWithCourses);
router.get("/teachers-with-courses", authorize("admin"), requirePlanFeature("reporting_workflow"), getTeachersWithCourses);

router.get("/:id", authorize("admin"), requirePlanFeature("user_management"), getUser);
router.put("/:id", authorize("admin"), requirePlanFeature("user_management"), updateUser);
router.delete("/:id", authorize("admin"), requirePlanFeature("user_management"), deleteUser);

export default router;
