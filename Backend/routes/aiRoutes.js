import express from "express";
import {
  chatWithTutor,
  generateExam,
  generateReportComment,
  getAdminInsights,
  getAiUsageSummary,
  getTutorHistory,
  parentAssistant,
} from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import {
  requirePlanFeature,
  requireSchoolAccess,
} from "../middleware/subscriptionMiddleware.js";
import { createRateLimiter } from "../middleware/rateLimitMiddleware.js";
import { requireSchoolScope } from "../middleware/schoolScopeMiddleware.js";

const router = express.Router();

const aiRateLimiter = createRateLimiter({
  keyPrefix: "ai-tools",
  windowMs: 5 * 60 * 1000,
  max: 12,
  message: "AI requests are moving too fast from this account. Please slow down a bit.",
  keyGenerator: (req) => `${req.ip}:${req.user?._id || "anonymous"}:${req.path}`,
});

router.use(protect, requireSchoolAccess, aiRateLimiter);

router.get("/usage-summary", getAiUsageSummary);
router.get(
  "/chat/history",
  authorize("student"),
  requirePlanFeature("ai_student_tutor"),
  getTutorHistory
);

router.post(
  "/chat",
  authorize("student"),
  requirePlanFeature("ai_student_tutor"),
  requireSchoolScope,
  chatWithTutor
);

router.post(
  "/generate-exam",
  authorize("teacher", "admin"),
  requirePlanFeature("ai_exam_generator"),
  requireSchoolScope,
  generateExam
);

router.post(
  "/report-comment",
  authorize("teacher", "admin"),
  requirePlanFeature("ai_report_comments"),
  requireSchoolScope,
  generateReportComment
);

router.post(
  "/admin-insights",
  authorize("admin"),
  requirePlanFeature("ai_admin_analytics"),
  requireSchoolScope,
  getAdminInsights
);

router.post(
  "/parent-assistant",
  authorize("parent"),
  requirePlanFeature("ai_parent_assistant"),
  requireSchoolScope,
  parentAssistant
);

export default router;
