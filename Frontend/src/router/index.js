import { createRouter, createWebHistory } from "vue-router";

import Login from "../views/Login.vue";
import Register from "../views/Register.vue";
import ForgotPassword from "../views/ForgotPassword.vue";
import ResetPassword from "../views/ResetPassword.vue";

import AdminDashboard from "../views/admin/Dashboard.vue";
import TeacherDashboard from "../views/teacher/Dashboard.vue";
import StudentDashboard from "../views/student/Dashboard.vue";
import ParentDashboard from "../views/parent/Dashboard.vue";

// ✅ DEFINE ROUTES FIRST
const routes = [
  { path: "/", component: Login },
  { path: "/register", component: Register },
  { path: "/forgot-password", component: ForgotPassword },
  { path: "/reset-password", component: ResetPassword },

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

// ✅ CREATE ROUTER
const router = createRouter({
  history: createWebHistory(),
  routes,
});

// ✅ NOW USE router
router.beforeEach((to, from, next) => {
  const user = JSON.parse(sessionStorage.getItem("user"));
  const token = sessionStorage.getItem("token");

  if (to.meta.requiresAuth) {
    if (!token || !user) {
      return next("/");
    }

    if (to.meta.role && user.role !== to.meta.role) {
      switch (user.role) {
        case "admin":
          return next("/dashboard/admin");
        case "teacher":
          return next("/dashboard/teacher");
        case "student":
          return next("/dashboard/student");
        case "parent":
          return next("/dashboard/parent");
        default:
          return next("/");
      }
    }
  }

  next();
});

export default router;