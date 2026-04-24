import express from "express";
import {
  clearStudentAssignments,
  clearTeacherAssignments,
  createCourse,
  deleteStudentAssignment,
  deleteTeacherAssignment,
  getCourses,
  getAssignmentHistory,
  getStudentsWithCourses,
  getTeachersWithCourses,
  assignStudent,
  assignTeacher,
  updateStudentAssignment,
  updateTeacherAssignment,
} from "../controllers/courseController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import {
  requirePlanFeature,
  requireSchoolAccess,
} from "../middleware/subscriptionMiddleware.js";

const router = express.Router();

router.use(protect, requireSchoolAccess);
router.use(requirePlanFeature("course_setup"));

router.post("/", authorize("admin"), createCourse);
router.get("/", getCourses);
router.post("/assign-student", authorize("admin"), assignStudent);
router.post("/assign-teacher", authorize("admin"), assignTeacher);
router.get("/assignments/history", authorize("admin"), getAssignmentHistory);
router.put(
  "/assignments/student/:studentId/:courseId",
  authorize("admin"),
  updateStudentAssignment
);
router.delete(
  "/assignments/student/:studentId/:courseId",
  authorize("admin"),
  deleteStudentAssignment
);
router.delete("/assignments/student", authorize("admin"), clearStudentAssignments);
router.put(
  "/assignments/teacher/:courseId",
  authorize("admin"),
  updateTeacherAssignment
);
router.delete(
  "/assignments/teacher/:courseId",
  authorize("admin"),
  deleteTeacherAssignment
);
router.delete("/assignments/teacher", authorize("admin"), clearTeacherAssignments);
router.get("/students-with-courses", authorize("admin"), getStudentsWithCourses);
router.get("/teachers-with-courses", authorize("admin"), getTeachersWithCourses);

export default router;
