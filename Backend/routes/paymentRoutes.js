import express from "express";
import {
  clearPayments,
  createPayment,
  deletePayment,
  getPayments,
  getMyPayments,
  updatePaymentStatus,
} from "../controllers/paymentController.js";
import { getUsers } from "../controllers/userControllerV2.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import {
  requirePlanFeature,
  requireSchoolAccess,
} from "../middleware/subscriptionMiddleware.js";

const router = express.Router();

router.use(protect, requireSchoolAccess);

router.post(
  "/",
  authorize("parent", "student"),
  upload.single("receipt"),
  createPayment
);
router.get("/mine", authorize("parent", "student"), getMyPayments);
router.get("/", authorize("admin"), requirePlanFeature("high_volume_operations"), getPayments);
router.put("/:id", authorize("admin"), requirePlanFeature("high_volume_operations"), updatePaymentStatus);
router.delete("/:id", authorize("admin"), requirePlanFeature("high_volume_operations"), deletePayment);
router.delete("/", authorize("admin"), requirePlanFeature("high_volume_operations"), clearPayments);
router.get("/users", authorize("admin"), requirePlanFeature("high_volume_operations"), getUsers);

export default router;
