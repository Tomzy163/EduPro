import { createRouter, createWebHistory } from "vue-router";

import Login from "../views/Login.vue";
import Register from "../views/Register.vue";
import ForgotPassword from "../views/ForgotPassword.vue";
import ResetPassword from "../views/ResetPassword.vue";

import AdminDashboard from "../views/admin/Dashboard.vue";
import TeacherDashboard from "../views/teacher/Dashboard.vue";
import StudentDashboard from "../views/student/Dashboard.vue";
import ParentDashboard from "../views/parent/Dashboard.vue";

const routes = [
  { path: "/", component: Login },

  // ✅ ADD THESE
  { path: "/register", component: Register },
  { path: "/forgot-password", component: ForgotPassword },
  { path: "/reset-password", component: ResetPassword },

  // Dashboards
  { path: "/dashboard/admin", component: AdminDashboard },
  { path: "/dashboard/teacher", component: TeacherDashboard },
  { path: "/dashboard/student", component: StudentDashboard },
  { path: "/dashboard/parent", component: ParentDashboard },
  { path: "/:pathMatch(.*)*", redirect: "/" }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;