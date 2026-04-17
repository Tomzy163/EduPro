import mongoose from "mongoose";
import School from "../models/School.js";
import User from "../models/User.js";
import Payment from "../models/Payment.js";
import { emitSchoolAdminUpdate } from "../utils/realtime.js";
import { getSubscriptionSnapshot } from "../utils/subscription.js";
import {
  appendSchoolAlias,
  findSchoolByIdentifier,
} from "../utils/schoolDirectory.js";

const serializeSchool = (school) => ({
  _id: school._id,
  name: school.name,
  code: school.schoolCode || "",
  bankName: school.bankName || "",
  accountName: school.accountName || "",
  accountNumber: school.accountNumber || "",
  paymentInstructions: school.paymentInstructions || "",
  subscription: getSubscriptionSnapshot(school),
});

export const getMySchool = async (req, res) => {
  try {
    const schoolId = req.user.school?._id || req.user.school;
    const school = await School.findById(schoolId);

    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }

    res.json({ school: serializeSchool(school) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateMySchool = async (req, res) => {
  try {
    const schoolId = req.user.school?._id || req.user.school;
    const school = await School.findById(schoolId);

    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }

    const nextName = String(req.body.name || school.name).trim();

    if (!nextName) {
      return res.status(400).json({ message: "School name is required" });
    }

    const existingSchool = await findSchoolByIdentifier(nextName);

    if (existingSchool && String(existingSchool._id) !== String(school._id)) {
      return res.status(400).json({ message: "Another school already uses this name" });
    }

    const previousName = school.name;
    school.name = nextName;
    school.bankName = String(req.body.bankName || "").trim();
    school.accountName = String(req.body.accountName || "").trim();
    school.accountNumber = String(req.body.accountNumber || "").trim();
    school.paymentInstructions = String(req.body.paymentInstructions || "").trim();

    if (previousName && previousName !== nextName) {
      appendSchoolAlias(school, previousName);
    }

    await school.save();

    res.json({
      message: "School profile updated successfully.",
      school: serializeSchool(school),
    });

    await emitSchoolAdminUpdate({
      schoolId: school._id,
      entity: "school",
      action: "updated",
      message: "Admin updated school profile details.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDashboardSummary = async (req, res) => {
  try {
    const schoolId = new mongoose.Types.ObjectId(
      String(req.user.school?._id || req.user.school)
    );

    const [userCounts, paymentCounts, revenue] = await Promise.all([
      User.aggregate([
        { $match: { school: schoolId } },
        { $group: { _id: "$role", count: { $sum: 1 } } },
      ]),
      Payment.aggregate([
        { $match: { school: schoolId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Payment.aggregate([
        {
          $match: {
            school: schoolId,
            status: "approved",
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $toDouble: "$amount" } },
          },
        },
      ]),
    ]);

    const usersByRole = Object.fromEntries(
      userCounts.map((entry) => [entry._id, entry.count])
    );
    const paymentsByStatus = Object.fromEntries(
      paymentCounts.map((entry) => [entry._id, entry.count])
    );

    res.json({
      users: {
        students: usersByRole.student || 0,
        teachers: usersByRole.teacher || 0,
        parents: usersByRole.parent || 0,
        admins: usersByRole.admin || 0,
      },
      payments: {
        approved: paymentsByStatus.approved || 0,
        pending: paymentsByStatus.pending || 0,
        rejected: paymentsByStatus.rejected || 0,
        total: Object.values(paymentsByStatus).reduce((sum, count) => sum + count, 0),
      },
      revenue: Number(revenue[0]?.total || 0),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
