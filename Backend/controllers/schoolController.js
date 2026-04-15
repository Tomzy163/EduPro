import School from "../models/School.js";
import { emitSchoolAdminUpdate } from "../utils/realtime.js";
import { getSubscriptionSnapshot } from "../utils/subscription.js";

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const serializeSchool = (school) => ({
  _id: school._id,
  name: school.name,
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

    const existingSchool = await School.findOne({
      _id: { $ne: school._id },
      name: { $regex: `^${escapeRegex(nextName)}$`, $options: "i" },
    });

    if (existingSchool) {
      return res.status(400).json({ message: "Another school already uses this name" });
    }

    school.name = nextName;
    school.bankName = String(req.body.bankName || "").trim();
    school.accountName = String(req.body.accountName || "").trim();
    school.accountNumber = String(req.body.accountNumber || "").trim();
    school.paymentInstructions = String(req.body.paymentInstructions || "").trim();

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
