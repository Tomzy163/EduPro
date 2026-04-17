const PLAN_FEATURES = {
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
  user_management: "User management",
  course_setup: "Course setup",
  timetable_setup: "Timetable setup",
  attendance_tracking: "Attendance tracking",
  result_tracking: "Result tracking",
  priority_communication: "Priority communication tools",
  reporting_workflow: "Reporting workflow",
  high_volume_operations: "High-volume operations",
  advanced_monitoring: "Advanced monitoring",
  maximum_platform_access: "Maximum platform access",
};

export const FEATURE_REQUIRED_PLAN = {
  user_management: "Normal Plan",
  course_setup: "Normal Plan",
  timetable_setup: "Normal Plan",
  attendance_tracking: "Normal Plan",
  result_tracking: "Normal Plan",
  priority_communication: "Supreme Plan",
  reporting_workflow: "Supreme Plan",
  high_volume_operations: "Gold Plan",
  advanced_monitoring: "Gold Plan",
  maximum_platform_access: "Platinum Plan",
};

export const getPlanFeatures = (subscription = null) => {
  if (Array.isArray(subscription?.features) && subscription.features.length > 0) {
    return subscription.features;
  }

  const plan = String(subscription?.plan || "trial").toLowerCase();

  if (plan === "trial") {
    return PLAN_FEATURES.platinum;
  }

  return PLAN_FEATURES[plan] || PLAN_FEATURES.normal;
};

export const hasPlanFeature = (subscription, feature) =>
  getPlanFeatures(subscription).includes(feature);
