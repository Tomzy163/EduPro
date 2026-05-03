const PLAN_FEATURES = {
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
  ai_student_tutor: "AI Student Tutor",
  ai_exam_generator: "AI Exam Generator",
  ai_report_comments: "AI Report Comments",
  ai_admin_analytics: "AI Admin Analytics",
  ai_parent_assistant: "Parent AI Assistant",
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
  ai_student_tutor: "Basic Plan",
  ai_exam_generator: "Premium Plan",
  ai_report_comments: "Premium Plan",
  ai_admin_analytics: "Premium Plan",
  ai_parent_assistant: "Premium Plan",
};

export const getPlanFeatures = (subscription = null) => {
  if (
    !subscription ||
    subscription.limitedAccess === true ||
    subscription.hasAppAccess === false
  ) {
    return [];
  }

  if (Array.isArray(subscription?.features) && subscription.features.length > 0) {
    return subscription.features;
  }

  const plan = String(subscription?.plan || "trial").toLowerCase();

  if (plan === "trial") {
    return PLAN_FEATURES.normal;
  }

  return PLAN_FEATURES[plan] || PLAN_FEATURES.normal;
};

export const hasPlanFeature = (subscription, feature) =>
  getPlanFeatures(subscription).includes(feature);
