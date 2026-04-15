import School from "../models/School.js";
import { getSubscriptionSnapshot } from "../utils/subscription.js";

const syncExpiredTrial = async (school) => {
  const snapshot = getSubscriptionSnapshot(school);

  if (snapshot.status === "expired" && school.subscriptionStatus !== "expired") {
    school.subscriptionStatus = "expired";
    await school.save();
  }

  return snapshot;
};

export const requireSchoolAccess = async (req, res, next) => {
  try {
    const school =
      req.user?.school?._id && typeof req.user.school !== "string"
        ? req.user.school
        : await School.findById(req.user?.school);

    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }

    const snapshot = await syncExpiredTrial(school);

    req.schoolAccess = snapshot;
    req.user.school = school;

    if (snapshot.hasAppAccess) {
      return next();
    }

    const message =
      "Your school's free trial has ended. The admin must subscribe to continue using the app.";

    return res.status(402).json({
      message,
      code: "SUBSCRIPTION_REQUIRED",
      subscription: snapshot,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
