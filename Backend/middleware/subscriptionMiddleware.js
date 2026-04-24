import School from "../models/School.js";
import {
  FEATURE_LABELS,
  SUBSCRIPTION_PLANS,
  getPlanForFeature,
  getSubscriptionSnapshot,
  hasPlanFeature,
} from "../utils/subscription.js";
import { syncLatestDatabaseBackup } from "../utils/databaseBackup.js";

const syncExpiredTrial = async (school) => {
  const snapshot = getSubscriptionSnapshot(school);

  if (snapshot.status === "expired" && school.subscriptionStatus !== "expired") {
    school.subscriptionStatus = "expired";
    await school.save();
    await syncLatestDatabaseBackup({ reason: "subscription-expired" });
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

export const requirePlanFeature = (feature) => {
  return async (req, res, next) => {
    try {
      const school =
        req.user?.school?._id && typeof req.user.school !== "string"
          ? req.user.school
          : await School.findById(req.user?.school);

      if (!school) {
        return res.status(404).json({ message: "School not found" });
      }

      const snapshot = req.schoolAccess || (await syncExpiredTrial(school));

      req.schoolAccess = snapshot;
      req.user.school = school;

      if (!snapshot.hasAppAccess) {
        return res.status(402).json({
          message:
            "Your school's free trial has ended. The admin must subscribe to continue using the app.",
          code: "SUBSCRIPTION_REQUIRED",
          subscription: snapshot,
        });
      }

      if (hasPlanFeature(snapshot.plan, feature)) {
        return next();
      }

      const requiredPlan = getPlanForFeature(feature);

      return res.status(403).json({
        message: `The ${SUBSCRIPTION_PLANS[snapshot.plan]?.name || snapshot.plan} does not include ${FEATURE_LABELS[feature] || feature}. Upgrade to the ${SUBSCRIPTION_PLANS[requiredPlan]?.name || requiredPlan} to unlock it.`,
        code: "PLAN_FEATURE_NOT_AVAILABLE",
        feature,
        requiredPlan,
        subscription: snapshot,
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  };
};
