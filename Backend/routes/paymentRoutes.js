import express from "express";
import {
  createPayment,
  getPayments,
  updatePaymentStatus,
} from "../controllers/paymentController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Parent / Student upload payment
router.post(
  "/",
  protect,
  authorize("parent", "student"),
  upload.single("receipt"),
  createPayment
);

// Admin
router.get("/", protect, authorize("admin"), getPayments);

router.put(
  "/:id",
  protect,
  authorize("admin"),
  updatePaymentStatus
);

export default router;