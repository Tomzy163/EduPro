import { createRouter, createWebHistory } from "vue-router";

const Login = () => import("../views/Login.vue");
const Register = () => import("../views/Register.vue");
const ForgotPassword = () => import("../views/ForgotPassword.vue");
const ResetPassword = () => import("../views/ResetPassword.vue");
const SubscriptionView = () => import("../views/Subscription.vue");
const DashboardLayout = () => import("../layouts/DashboardLayout.vue");

const AdminDashboard = () => import("../views/admin/Dashboard.vue");
const AdminAIInsights = () => import("../views/admin/AIInsights.vue");
const TeacherDashboard = () => import("../views/teacher/Dashboard.vue");
const TeacherExamGenerator = () => import("../views/teacher/ExamGenerator.vue");
const StudentDashboard = () => import("../views/student/Dashboard.vue");
const StudentAITutor = () => import("../views/student/AITutor.vue");
const ParentDashboard = () => import("../views/parent/Dashboard.vue");
const ParentAIAssistant = () => import("../views/parent/AIAssistant.vue");
const ReportCommentsView = () => import("../views/shared/ReportComments.vue");

const routes = [
  { path: "/", component: Login },
  { path: "/register", component: Register },
  { path: "/forgot-password", component: ForgotPassword },
  { path: "/reset-password", component: ResetPassword },
  {
    path: "/subscription",
    component: SubscriptionView,
    meta: { requiresAuth: true, role: "admin" },
  },
  {
    path: "/dashboard",
    component: DashboardLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: "admin",
        component: AdminDashboard,
        meta: { requiresAuth: true, role: "admin", title: "Admin Dashboard" },
      },
      {
        path: "admin/ai-insights",
        component: AdminAIInsights,
        meta: { requiresAuth: true, role: "admin", title: "AI Admin Analytics" },
      },
      {
        path: "admin/report-comments",
        component: ReportCommentsView,
        meta: { requiresAuth: true, role: "admin", title: "Report Comments" },
      },
      {
        path: "teacher",
        component: TeacherDashboard,
        meta: { requiresAuth: true, role: "teacher", title: "Teacher Dashboard" },
      },
      {
        path: "teacher/exam-generator",
        component: TeacherExamGenerator,
        meta: { requiresAuth: true, role: "teacher", title: "Exam Generator" },
      },
      {
        path: "teacher/report-comments",
        component: ReportCommentsView,
        meta: { requiresAuth: true, role: "teacher", title: "Report Comments" },
      },
      {
        path: "student",
        component: StudentDashboard,
        meta: { requiresAuth: true, role: "student", title: "Student Dashboard" },
      },
      {
        path: "student/ai-tutor",
        component: StudentAITutor,
        meta: { requiresAuth: true, role: "student", title: "AI Tutor" },
      },
      {
        path: "parent",
        component: ParentDashboard,
        meta: { requiresAuth: true, role: "parent", title: "Parent Dashboard" },
      },
      {
        path: "parent/ai-assistant",
        component: ParentAIAssistant,
        meta: { requiresAuth: true, role: "parent", title: "Parent Assistant" },
      },
    ],
  },
  { path: "/:pathMatch(.*)*", redirect: "/" },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

const getSafeStoredUser = () => {
  try {
    const rawUser = sessionStorage.getItem("user");
    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    return null;
  }
};

const getSafeStoredSchool = () => {
  try {
    const rawSchool = sessionStorage.getItem("school");
    return rawSchool ? JSON.parse(rawSchool) : null;
  } catch {
    return null;
  }
};

const clearStoredSession = () => {
  sessionStorage.removeItem("user");
  sessionStorage.removeItem("school");
  sessionStorage.removeItem("token");
};

const getDashboardRouteForRole = (role) => {
  switch (role) {
    case "admin":
      return "/dashboard/admin";
    case "teacher":
      return "/dashboard/teacher";
    case "student":
      return "/dashboard/student";
    case "parent":
      return "/dashboard/parent";
    default:
      return "/";
  }
};

router.beforeEach((to, _from, next) => {
  const user = getSafeStoredUser();
  const school = getSafeStoredSchool();
  const token = sessionStorage.getItem("token");

  if (to.meta.requiresAuth && (!token || !user)) {
    return next("/");
  }

  if (to.meta.role && user?.role !== to.meta.role) {
    return next(getDashboardRouteForRole(user?.role));
  }

  const limitedAccess = Boolean(
    user?.subscription?.limitedAccess || school?.subscription?.limitedAccess
  );

  if (limitedAccess) {
    if (user?.role === "admin") {
      if (to.path !== "/subscription") {
        return next("/subscription");
      }
    } else {
      clearStoredSession();
      return next("/");
    }
  }

  return next();
});

export default router;
