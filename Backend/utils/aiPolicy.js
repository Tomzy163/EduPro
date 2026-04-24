export const AI_FEATURE_KEYS = {
  tutor: "ai_student_tutor",
  examGenerator: "ai_exam_generator",
  reportComments: "ai_report_comments",
  adminAnalytics: "ai_admin_analytics",
  parentAssistant: "ai_parent_assistant",
};

const ALL_PREMIUM_AI_FEATURES = [
  AI_FEATURE_KEYS.tutor,
  AI_FEATURE_KEYS.examGenerator,
  AI_FEATURE_KEYS.reportComments,
  AI_FEATURE_KEYS.adminAnalytics,
  AI_FEATURE_KEYS.parentAssistant,
];

const PLAN_MARKETING_NAMES = {
  trial: "Free Trial",
  normal: "Basic",
  supreme: "Premium",
  gold: "Enterprise",
  platinum: "Enterprise Plus",
};

const AI_POLICY_BY_PLAN = {
  trial: {
    monthlyLimit: 30,
    features: [AI_FEATURE_KEYS.tutor],
  },
  normal: {
    monthlyLimit: 250,
    features: [AI_FEATURE_KEYS.tutor],
  },
  supreme: {
    monthlyLimit: 1200,
    features: ALL_PREMIUM_AI_FEATURES,
  },
  gold: {
    monthlyLimit: 3500,
    features: ALL_PREMIUM_AI_FEATURES,
  },
  platinum: {
    monthlyLimit: 10000,
    features: ALL_PREMIUM_AI_FEATURES,
  },
};

export const getAiPolicyForPlan = (plan = "trial") =>
  AI_POLICY_BY_PLAN[String(plan || "trial").toLowerCase()] || AI_POLICY_BY_PLAN.trial;

export const resolveAiPolicy = (schoolOrSubscription = {}) => {
  const plan = String(
    schoolOrSubscription?.plan ||
      schoolOrSubscription?.currentPlan ||
      schoolOrSubscription?.subscription?.plan ||
      "trial"
  ).toLowerCase();
  const policy = getAiPolicyForPlan(plan);

  return {
    plan,
    marketingPlan: PLAN_MARKETING_NAMES[plan] || plan,
    monthlyLimit: policy.monthlyLimit,
    features: policy.features,
  };
};
