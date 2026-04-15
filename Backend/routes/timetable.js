import express from "express";
import Timetable from "../models/Timetable.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { requireSchoolAccess } from "../middleware/subscriptionMiddleware.js";
import { emitSchoolAdminUpdate } from "../utils/realtime.js";

const router = express.Router();

router.use(protect, requireSchoolAccess);

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
    const slot = await Timetable.create(
      buildTimetablePayload(req.body, req.user.school._id)
    );

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

    const payload = slots.map((slot) =>
      buildTimetablePayload(slot, req.user.school._id)
    );

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
    const updatedSlot = await Timetable.findOneAndUpdate(
      { _id: req.params.id, school: req.user.school._id },
      buildTimetablePayload(req.body, req.user.school._id),
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
