import express from "express";
import { getMySchool, updateMySchool } from "../controllers/schoolController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getMySchool);
router.put("/", authorize("admin"), updateMySchool);

export default router;
