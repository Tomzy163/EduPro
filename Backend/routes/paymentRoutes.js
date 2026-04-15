import express from "express";
import {
  createPayment,
  getPayments,
  getMyPayments,
  updatePaymentStatus,
} from "../controllers/paymentController.js";
import { getUsers } from "../controllers/userController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import { requireSchoolAccess } from "../middleware/subscriptionMiddleware.js";

const router = express.Router();

router.use(protect, requireSchoolAccess);

router.post(
  "/",
  authorize("parent", "student"),
  upload.single("receipt"),
  createPayment
);
router.get("/mine", authorize("parent", "student"), getMyPayments);
router.get("/", authorize("admin"), getPayments);
router.put("/:id", authorize("admin"), updatePaymentStatus);
router.get("/users", authorize("admin"), getUsers);
router.get("/payments", authorize("admin"), getPayments);

export default router;
