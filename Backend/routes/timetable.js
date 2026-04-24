import express from "express";
import Course from "../models/Course.js";
import Timetable from "../models/Timetable.js";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import {
  requirePlanFeature,
  requireSchoolAccess,
} from "../middleware/subscriptionMiddleware.js";
import { emitSchoolAdminUpdate } from "../utils/realtime.js";

const router = express.Router();

router.use(protect, requireSchoolAccess);
router.use(requirePlanFeature("timetable_setup"));

const buildTimetablePayload = (body, schoolId) => {
  const payload = {
    school: schoolId,
    name: body.name,
    course: body.course,
    audience: body.audience,
    day: body.day,
    time: body.time,
    location: body.location || "",
    teacher: null,
    student: null,
  };

  if (body.audience === "teacher") {
    payload.teacher = body.assigneeId;
  }

  if (body.audience === "student") {
    payload.student = body.assigneeId;
  }

  return payload;
};

const validateTimetablePayload = async (body, schoolId) => {
  const payload = buildTimetablePayload(body, schoolId);

  if (!payload.name || !payload.course || !payload.audience || !payload.day || !payload.time) {
    return { error: "Name, course, audience, day, and time are required." };
  }

  if (!["teacher", "student"].includes(payload.audience)) {
    return { error: "Select whether the timetable is for a teacher or student." };
  }

  const course = await Course.findOne({
    _id: payload.course,
    school: schoolId,
  }).select("_id");

  if (!course) {
    return { error: "Select a valid course from this school." };
  }

  const assigneeRole = payload.audience === "teacher" ? "teacher" : "student";
  const assigneeId = payload.audience === "teacher" ? payload.teacher : payload.student;

  if (!assigneeId) {
    return { error: `Select the ${assigneeRole} for this timetable slot.` };
  }

  const assignee = await User.findOne({
    _id: assigneeId,
    school: schoolId,
    role: assigneeRole,
  }).select("_id");

  if (!assignee) {
    return { error: `Select a valid ${assigneeRole} from this school.` };
  }

  return { payload };
};

router.get("/", async (req, res) => {
  try {
    const query = { school: req.user.school._id };

    if (req.user.role === "teacher") {
      query.teacher = req.user._id;
    }

    if (req.user.role === "student") {
      query.student = req.user._id;
    }

    if (req.user.role === "parent") {
      query.student = { $in: req.user.children || [] };
    }

    const slots = await Timetable.find(query)
      .populate("course")
      .populate("teacher")
      .populate("student");

    res.json(slots);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", authorize("admin"), async (req, res) => {
  try {
    const { payload, error } = await validateTimetablePayload(
      req.body,
      req.user.school._id
    );

    if (error) {
      return res.status(400).json({ message: error });
    }

    const slot = await Timetable.create(payload);

    res.status(201).json(slot);

    await emitSchoolAdminUpdate({
      schoolId: req.user.school._id,
      entity: "timetable",
      action: "created",
      message: "Admin created a timetable slot.",
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post("/bulk", authorize("admin"), async (req, res) => {
  try {
    const slots = Array.isArray(req.body) ? req.body : req.body.slots;

    if (!Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({ message: "At least one timetable slot is required" });
    }

    const payload = [];

    for (const slot of slots) {
      const validation = await validateTimetablePayload(slot, req.user.school._id);

      if (validation.error) {
        return res.status(400).json({ message: validation.error });
      }

      payload.push(validation.payload);
    }

    const createdSlots = await Timetable.insertMany(payload);
    res.status(201).json(createdSlots);

    await emitSchoolAdminUpdate({
      schoolId: req.user.school._id,
      entity: "timetable",
      action: "created",
      message: "Admin saved timetable changes.",
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put("/:id", authorize("admin"), async (req, res) => {
  try {
    const { payload, error } = await validateTimetablePayload(
      req.body,
      req.user.school._id
    );

    if (error) {
      return res.status(400).json({ message: error });
    }

    const updatedSlot = await Timetable.findOneAndUpdate(
      { _id: req.params.id, school: req.user.school._id },
      payload,
      { new: true }
    )
      .populate("course")
      .populate("teacher")
      .populate("student");

    if (!updatedSlot) {
      return res.status(404).json({ message: "Timetable slot not found" });
    }

    res.json(updatedSlot);

    await emitSchoolAdminUpdate({
      schoolId: req.user.school._id,
      entity: "timetable",
      action: "updated",
      message: "Admin updated a timetable slot.",
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete("/:id", authorize("admin"), async (req, res) => {
  try {
    const deletedSlot = await Timetable.findOneAndDelete({
      _id: req.params.id,
      school: req.user.school._id,
    });

    if (!deletedSlot) {
      return res.status(404).json({ message: "Timetable slot not found" });
    }

    res.json({ message: "Deleted" });

    await emitSchoolAdminUpdate({
      schoolId: req.user.school._id,
      entity: "timetable",
      action: "deleted",
      message: "Admin deleted a timetable slot.",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
