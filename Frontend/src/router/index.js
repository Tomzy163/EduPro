import { createRouter, createWebHistory } from "vue-router";

// Layouts
import AuthLayout from "../layouts/AuthLayout.vue";
import DashboardLayout from "../layouts/DashboardLayout.vue";

// Pages
import Login from "../views/Login.vue";
import Register from "../views/Register.vue";
import ForgotPassword from "../views/ForgotPassword.vue";
import ResetPassword from "../views/ResetPassword.vue";

// Dashboards
import AdminDashboard from "../views/admin/Dashboard.vue";
import TeacherDashboard from "../views/teacher/Dashboard.vue";
import StudentDashboard from "../views/student/Dashboard.vue";
import ParentDashboard from "../views/parent/Dashboard.vue";

const routes = [
  // 🔐 AUTH ROUTES
  {
    path: "/",
    component: AuthLayout,
    children: [
      { path: "", component: Login },
      { path: "register", component: Register },
      { path: "forgot-password", component: ForgotPassword },
      { path: "reset-password", component: ResetPassword },
    ],
  },

  // 🧠 DASHBOARD ROUTES (FIXED PATH)
  {
  path: "/dashboard",
  component: DashboardLayout,
  children: [
    { path: "/dashboard/admin", component: AdminDashboard },
    { path: "/dashboard/teacher", component: TeacherDashboard },
    { path: "/dashboard/student", component: StudentDashboard },
    { path: "/dashboard/parent", component: ParentDashboard },
  ],
}
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});
// ✅ Route guard for authentication & role-based access
router.beforeEach((to, from, next) => {
  const user = JSON.parse(localStorage.getItem("user"));

  const publicPages = ["/", "/register", "/forgot-password", "/reset-password"];
  const authRequired = !publicPages.includes(to.path);

  if (authRequired && !user) {
    return next("/");
  }

  // Role-based protection
  const roleMap = {
    "/dashboard/admin": "admin",
    "/dashboard/teacher": "teacher",
    "/dashboard/student": "student",
    "/dashboard/parent": "parent",
  };

  if (roleMap[to.path] && user?.role !== roleMap[to.path]) {
    return next("/");
  }

  next();
});

export default router;