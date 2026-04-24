import AIUsageLog from "../models/AIUsageLog.js";
import { resolveAiPolicy } from "./aiPolicy.js";

export const getCurrentMonthKey = (value = new Date()) => {
  const date = new Date(value);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
};

export const getUsageSummary = async ({ school, user }) => {
  const schoolId = school?._id || school;
  const userId = user?._id || user;
  const policy = resolveAiPolicy(school);
  const monthKey = getCurrentMonthKey();

  const usageRows = await AIUsageLog.aggregate([
    {
      $match: {
        school: schoolId,
        user: userId,
        monthKey,
      },
    },
    {
      $group: {
        _id: "$feature",
        total: { $sum: 1 },
      },
    },
  ]);

  const usageByFeature = Object.fromEntries(
    usageRows.map((row) => [row._id, row.total])
  );
  const totalUsed = usageRows.reduce((sum, row) => sum + row.total, 0);

  return {
    monthKey,
    plan: policy.plan,
    marketingPlan: policy.marketingPlan,
    monthlyLimit: policy.monthlyLimit,
    totalUsed,
    remaining: Math.max(0, policy.monthlyLimit - totalUsed),
    limitReached: totalUsed >= policy.monthlyLimit,
    availableFeatures: policy.features,
    usageByFeature,
  };
};

export const ensureAiUsageAccess = async ({ school, user, feature }) => {
  const policy = resolveAiPolicy(school);

  if (!policy.features.includes(feature)) {
    const error = new Error(
      `${policy.marketingPlan} does not include this AI workflow. Upgrade the school plan to unlock it.`
    );
    error.statusCode = 403;
    error.code = "AI_FEATURE_NOT_AVAILABLE";
    throw error;
  }

  const usage = await getUsageSummary({ school, user });

  if (usage.limitReached) {
    const error = new Error(
      `The monthly AI usage limit for the ${policy.marketingPlan} plan has been reached.`
    );
    error.statusCode = 429;
    error.code = "AI_USAGE_LIMIT_REACHED";
    error.usage = usage;
    throw error;
  }

  return {
    policy,
    usage,
  };
};

export const recordAiUsage = async ({
  school,
  user,
  feature,
  status = "success",
  requestText = "",
  responseText = "",
  metadata = {},
}) => {
  await AIUsageLog.create({
    school: school?._id || school,
    user: user?._id || user,
    role: user?.role || "",
    plan: school?.currentPlan || school?.plan || "trial",
    feature,
    status,
    monthKey: getCurrentMonthKey(),
    requestCharacters: String(requestText || "").length,
    responseCharacters: String(responseText || "").length,
    metadata,
  });
};
