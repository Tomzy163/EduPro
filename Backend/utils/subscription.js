export const SUBSCRIPTION_PLANS = {
  trial: {
    name: "Free Trial",
    summary: "30-day access for new schools.",
  },
  normal: {
    name: "Normal Plan",
    summary: "Core school operations for smaller schools.",
    price: 75000,
  },
  supreme: {
    name: "Supreme Plan",
    summary: "Expanded reporting and collaboration tools.",
    price: 100000,
  },
  gold: {
    name: "Gold Plan",
    summary: "High-capacity access for fast-growing schools.",
    price: 150000,
  },
  platinum: {
    name: "Platinum Plan",
    summary: "Full premium access for large institutions.",
    price: 200000,
  },
};

export const PLAN_FEATURES = {
  normal: [
    "user_management",
    "course_setup",
    "timetable_setup",
    "attendance_tracking",
    "result_tracking",
  ],
  supreme: [
    "user_management",
    "course_setup",
    "timetable_setup",
    "attendance_tracking",
    "result_tracking",
    "priority_communication",
    "reporting_workflow",
  ],
  gold: [
    "user_management",
    "course_setup",
    "timetable_setup",
    "attendance_tracking",
    "result_tracking",
    "priority_communication",
    "reporting_workflow",
    "high_volume_operations",
    "advanced_monitoring",
  ],
  platinum: [
    "user_management",
    "course_setup",
    "timetable_setup",
    "attendance_tracking",
    "result_tracking",
    "priority_communication",
    "reporting_workflow",
    "high_volume_operations",
    "advanced_monitoring",
    "maximum_platform_access",
  ],
};

export const FEATURE_LABELS = {
  user_management: "user management",
  course_setup: "course setup",
  timetable_setup: "timetable setup",
  attendance_tracking: "attendance tracking",
  result_tracking: "result tracking",
  priority_communication: "priority communication tools",
  reporting_workflow: "better reporting workflow",
  high_volume_operations: "high-volume school operations",
  advanced_monitoring: "advanced monitoring",
  maximum_platform_access: "maximum platform access",
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const SUBSCRIPTION_DURATION_DAYS = 30;

export const getPlanFeatures = (plan = "trial") => {
  if (plan === "trial") {
    return PLAN_FEATURES.platinum;
  }

  return PLAN_FEATURES[plan] || PLAN_FEATURES.normal;
};

export const getPlanForFeature = (feature) => {
  const orderedPlans = ["normal", "supreme", "gold", "platinum"];
  return orderedPlans.find((plan) => getPlanFeatures(plan).includes(feature)) || "platinum";
};

export const hasPlanFeature = (plan = "trial", feature = "") =>
  getPlanFeatures(plan).includes(feature);

const resolvePaidPlanExpiry = (school) => {
  if (school?.subscriptionEndsAt) {
    return school.subscriptionEndsAt;
  }

  if (!school?.subscriptionStartedAt) {
    return null;
  }

  return new Date(
    new Date(school.subscriptionStartedAt).getTime() +
      SUBSCRIPTION_DURATION_DAYS * DAY_IN_MS
  );
};

export const getSubscriptionSnapshot = (school) => {
  const now = Date.now();
  const trialEndsAt = school?.trialEndsAt ? new Date(school.trialEndsAt).getTime() : null;
  const paidPlanEndsAt = resolvePaidPlanExpiry(school);
  const paidPlanEndsAtMs = paidPlanEndsAt ? new Date(paidPlanEndsAt).getTime() : null;
  const isTrialActive =
    school?.subscriptionStatus === "trial" && trialEndsAt && trialEndsAt > now;
  const isPaidActive =
    school?.subscriptionStatus === "active" &&
    (!paidPlanEndsAtMs || paidPlanEndsAtMs > now);
  const hasAppAccess = Boolean(isTrialActive || isPaidActive);

  let status = school?.subscriptionStatus || "trial";
  if (!hasAppAccess && status !== "active") {
    status = "expired";
  }

  if (!hasAppAccess && school?.subscriptionStatus === "active") {
    status = "expired";
  }

  const plan = school?.currentPlan || "trial";
  const features = getPlanFeatures(plan);

  return {
    plan,
    status,
    trialStartedAt: school?.trialStartedAt || null,
    trialEndsAt: school?.trialEndsAt || null,
    subscribedAt: school?.subscribedAt || null,
    subscriptionStartedAt: school?.subscriptionStartedAt || null,
    subscriptionEndsAt: paidPlanEndsAt || null,
    hasAppAccess,
    limitedAccess: !hasAppAccess,
    daysLeftInTrial:
      isTrialActive && trialEndsAt
        ? Math.max(0, Math.ceil((trialEndsAt - now) / DAY_IN_MS))
        : 0,
    daysLeftInPaidPlan:
      isPaidActive && paidPlanEndsAtMs
        ? Math.max(0, Math.ceil((paidPlanEndsAtMs - now) / DAY_IN_MS))
        : 0,
    features,
    featureAccess: Object.fromEntries(features.map((feature) => [feature, true])),
    availablePlans: Object.entries(SUBSCRIPTION_PLANS)
      .filter(([key]) => key !== "trial")
      .map(([key, value]) => ({
        id: key,
        ...value,
      })),
    paymentDetails: {
      provider: "Paystack",
      currency: process.env.PAYSTACK_CURRENCY || "NGN",
      paystackEnabled: Boolean(process.env.PAYSTACK_SECRET_KEY),
      note:
        process.env.SUBSCRIPTION_PAYMENT_NOTE ||
        "Payments are processed securely by Paystack and activated automatically by webhook.",
    },
  };
};

export const getSubscriptionDurationDays = () => SUBSCRIPTION_DURATION_DAYS;
