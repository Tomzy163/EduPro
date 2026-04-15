import { createRouter, createWebHistory } from "vue-router";

import Login from "../views/Login.vue";
import Register from "../views/Register.vue";
import ForgotPassword from "../views/ForgotPassword.vue";
import ResetPassword from "../views/ResetPassword.vue";
import SubscriptionView from "../views/Subscription.vue";

import AdminDashboard from "../views/admin/Dashboard.vue";
import TeacherDashboard from "../views/teacher/Dashboard.vue";
import StudentDashboard from "../views/student/Dashboard.vue";
import ParentDashboard from "../views/parent/Dashboard.vue";

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
    path: "/dashboard/admin",
    component: AdminDashboard,
    meta: { requiresAuth: true, role: "admin" },
  },
  {
    path: "/dashboard/teacher",
    component: TeacherDashboard,
    meta: { requiresAuth: true, role: "teacher" },
  },
  {
    path: "/dashboard/student",
    component: StudentDashboard,
    meta: { requiresAuth: true, role: "student" },
  },
  {
    path: "/dashboard/parent",
    component: ParentDashboard,
    meta: { requiresAuth: true, role: "parent" },
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
  const token = sessionStorage.getItem("token");

  if (to.meta.requiresAuth && (!token || !user)) {
    return next("/");
  }

  if (to.meta.role && user?.role !== to.meta.role) {
    return next(getDashboardRouteForRole(user?.role));
  }

  if (user?.role === "admin") {
    const limitedAccess = Boolean(user.subscription?.limitedAccess);

    if (limitedAccess && to.path !== "/subscription") {
      return next("/subscription");
    }
  }

  return next();
});

export default router;
