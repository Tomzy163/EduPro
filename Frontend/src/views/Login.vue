<!-- Frontend/src/views/Login.vue  -->

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../store/authStore";
import API from "../services/api";

const email = ref("");
const password = ref("");
const showPassword = ref(false);
const darkMode = ref(false);
const loading = ref(false);
const error = ref("");
const school = ref("");

const router = useRouter();
const auth = useAuthStore();

const handleLogin = async () => {
  try {
    loading.value = true;
    error.value = "";

    await auth.loginUser({
      email: email.value,
      password: password.value,
      school: school.value, // ✅ send school to backend
    });

    const role = auth.user.role;

      if (role === "admin") router.push("/dashboard/admin");
    else if (role === "teacher") router.push("/dashboard/teacher");
    else if (role === "student") router.push("/dashboard/student");
    else if (role === "parent") router.push("/dashboard/parent");

  } catch (err) {
    error.value = "Invalid email or password";
  } finally {
    loading.value = false;
  }
};

// const adminExists = ref(true);

// onMounted(async () => {
//   try {
//     const res = await fetch("http://localhost:5000/api/auth/admin-exists");
//     const data = await res.json();
//     adminExists.value = data.exists;
//   } catch {
//     adminExists.value = true;
//   }
// });
// onMounted(async () => {
//   const res = await API.get("/auth/admin-exists");

//   if (!res.data.exists) {
//     router.push("/register");
//   }
// });
</script>
<template>
  <div
    :class="[
      'login-page',
      darkMode ? 'dark' : ''
    ]"
  >
    <div class="login-card">

      <!-- TOP BAR -->
      <div class="top-bar">
        <button @click="darkMode = !darkMode">
          {{ darkMode ? "☀️ Light" : "🌙 Dark" }}
        </button>
      </div>

      <!-- TITLE -->
      <h1 class="logo">🎓 EduPro</h1>
      <p class="subtitle">School Management System</p>

      <h2 class="welcome">Welcome Back 👋</h2>

      <!-- ERROR -->
      <p v-if="error" class="error">
        {{ error }}
      </p>

      <!-- SCHOOL NAME -->
          <div class="mb-4">
      <label class="block text-sm mb-1">School</label>
      <input
        v-model="school"
        placeholder="Enter your school name"
        class="input"
      />
    </div>

      <!-- EMAIL -->
      <div class="form-group">
        <label>Email</label>
        <input v-model="email" type="email" placeholder="Enter your email" />
      </div>

      <!-- PASSWORD -->
      <div class="form-group password-group">
        <label>Password</label>

        <input
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          placeholder="Enter your password"
        />

        <span @click="showPassword = !showPassword">
          {{ showPassword ? "Hide" : "Show" }}
        </span>
      </div>

      <!-- LINKS -->
      <div class="links">
        <router-link to="/forgot-password">Forgot Password?</router-link>
        <small>Contact Admin for access</small>
      </div>

      <!-- BUTTON -->
      <button @click="handleLogin" class="login-btn">
        <span v-if="!loading">Login</span>
        <span v-else class="loader"></span>
      </button>

      <!-- FOOTER -->
      <p class="footer">
        Don’t have an account?
        <router-link to="/register">Register your school</router-link>
      </p>

    </div>
  </div>
</template>

<style scoped>
/* PAGE BACKGROUND */
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #2563eb, #4f46e5);
  font-family: 'Segoe UI', sans-serif;
  transition: 0.3s;
}

/* DARK MODE */
.login-page.dark {
  background: #0f172a;
}

/* CARD */
.login-card {
  width: 100%;
  max-width: 400px;
  background: white;
  padding: 40px;
  border-radius: 18px;
  box-shadow: 0 15px 40px rgba(0,0,0,0.15);
  transition: 0.3s;
}

.dark .login-card {
  background: #1e293b;
  color: white;
}

/* TOP BAR */
.top-bar {
  display: flex;
  justify-content: flex-end;
}

.top-bar button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  opacity: 0.7;
}

.top-bar button:hover {
  opacity: 1;
}

/* LOGO */
.logo {
  text-align: center;
  font-size: 24px;
  font-weight: bold;
}

.subtitle {
  text-align: center;
  font-size: 13px;
  margin-bottom: 10px;
  color: #6b7280;
}

.dark .subtitle {
  color: #cbd5f5;
}

/* HEADINGS */
.welcome {
  text-align: center;
  margin-bottom: 20px;
}

/* FORM */
.form-group {
  margin-bottom: 15px;
}

label {
  font-size: 13px;
  margin-bottom: 4px;
  display: block;
}

input {
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid #ddd;
  outline: none;
  transition: 0.2s;
}

input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37,99,235,0.2);
}

/* PASSWORD */
.password-group {
  position: relative;
}

.password-group span {
  position: absolute;
  right: 12px;
  top: 36px;
  font-size: 12px;
  cursor: pointer;
  color: #6b7280;
}

/* LINKS */
.links {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 20px;
}

.links a {
  color: #2563eb;
}

.links small {
  color: #6b7280;
}

/* BUTTON */
.login-btn {
  width: 100%;
  padding: 12px;
  background: #2563eb;
  color: white;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  transition: 0.2s;
}

.login-btn:hover {
  background: #1d4ed8;
  transform: translateY(-1px);
}

/* LOADER */
.loader {
  width: 18px;
  height: 18px;
  border: 2px solid white;
  border-top: transparent;
  border-radius: 50%;
  display: inline-block;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ERROR */
.error {
  background: #fee2e2;
  color: #dc2626;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 10px;
}

/* FOOTER */
.footer {
  text-align: center;
  margin-top: 15px;
  font-size: 13px;
}

.footer a {
  color: #2563eb;
}

/* MOBILE */
@media (max-width: 500px) {
  .login-card {
    margin: 10px;
    padding: 20px;
  }
}
</style>