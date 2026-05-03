import { env } from "../config/env.js";

export const SUBSCRIPTION_PLANS = {
  trial: {
    name: "Free Trial",
    summary: "30-day access for new schools.",
  },
  normal: {
    name: "Basic Plan",
    summary: "Core school operations plus AI student tutor access.",
    price: 75000,
  },
  supreme: {
    name: "Premium Plan",
    summary: "Expanded analytics, AI tools, and collaboration workflows.",
    price: 100000,
  },
  gold: {
    name: "Enterprise Plan",
    summary: "High-capacity access with advanced operations and support.",
    price: 150000,
  },
  platinum: {
    name: "Enterprise Plus",
    summary: "Full premium access for large institutions and priority scale.",
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
    "ai_student_tutor",
  ],
  supreme: [
    "user_management",
    "course_setup",
    "timetable_setup",
    "attendance_tracking",
    "result_tracking",
    "priority_communication",
    "reporting_workflow",
    "ai_student_tutor",
    "ai_exam_generator",
    "ai_report_comments",
    "ai_admin_analytics",
    "ai_parent_assistant",
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
    "ai_student_tutor",
    "ai_exam_generator",
    "ai_report_comments",
    "ai_admin_analytics",
    "ai_parent_assistant",
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
    "ai_student_tutor",
    "ai_exam_generator",
    "ai_report_comments",
    "ai_admin_analytics",
    "ai_parent_assistant",
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
  ai_student_tutor: "AI Student Tutor",
  ai_exam_generator: "AI Exam Generator",
  ai_report_comments: "AI Report Comment Generator",
  ai_admin_analytics: "AI Admin Analytics",
  ai_parent_assistant: "Parent AI Assistant",
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const SUBSCRIPTION_DURATION_DAYS = 30;

export const getPlanFeatures = (plan = "trial") => {
  if (plan === "trial") {
    return PLAN_FEATURES.normal;
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
      currency: env.paystackCurrency,
      paystackEnabled: Boolean(env.paystackSecretKey),
      note:
        process.env.SUBSCRIPTION_PAYMENT_NOTE ||
        "Payments are processed securely by Paystack and activated automatically by webhook.",
    },
  };
};

export const getSubscriptionDurationDays = () => SUBSCRIPTION_DURATION_DAYS;
