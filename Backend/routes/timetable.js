import express from "express";
import Timetable from "../models/Timetable.js";

const router = express.Router();

// GET all timetable slots
router.get("/", async (req, res) => {
  try {
    const slots = await Timetable.find()
      .populate("course")
      .populate("teacher")
      .populate("student");
    res.json(slots);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new slot
router.post("/", async (req, res) => {
  const { course, teacher, student, day, time } = req.body;
  try {
    const slot = await Timetable.create({ course, teacher, student, day, time });
    res.status(201).json(slot);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE a slot
router.delete("/:id", async (req, res) => {
  try {
    await Timetable.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;