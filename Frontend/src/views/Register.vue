<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { register } from "../services/authService";

const name = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const schoolName = ref("");

const showPassword = ref(false);
const showConfirmPassword = ref(false);
const loading = ref(false);
const error = ref("");
const success = ref("");
const darkMode = ref(false);

const router = useRouter();

const handleRegister = async () => {
  try {
    error.value = "";
    success.value = "";
    
    if (!schoolName.value) {
  error.value = "School name is required";
  return;
}

    if (!name.value || !email.value || !password.value || !schoolName.value) {
      error.value = "All fields are required";
      return;
    }

    if (password.value !== confirmPassword.value) {
      error.value = "Passwords do not match";
      return;
    }

    loading.value = true;

    await register({
      name: name.value,
      email: email.value,
      password: password.value,
      school: schoolName.value,
      role: "admin",
    });

    success.value = "Admin account created successfully 🎉";

    setTimeout(() => router.push("/"), 1500);
  } catch (err) {
    error.value = err.response?.data?.message || "Registration failed";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div :class="['register-page', darkMode ? 'dark' : 'light']">
    <div class="card">
      <!-- Dark Mode Toggle -->
      <div class="dark-toggle">
        <button @click="darkMode = !darkMode">{{ darkMode ? "☀️ Light" : "🌙 Dark" }}</button>
      </div>

      <h2 class="title">Create Admin Account 🚀</h2>

      <!-- Alerts -->
      <p v-if="error" class="alert alert-error">{{ error }}</p>
      <p v-if="success" class="alert alert-success">{{ success }}</p>

      <!-- Form -->
      <form @submit.prevent="handleRegister" class="form-grid">
        <!-- Full Name -->
        <div class="form-group">
          <label for="name">Full Name</label>
          <input v-model="name" id="name" type="text" placeholder="Enter your full name" class="input" />
        </div>

        <!-- School Name -->
        <div class="form-group">
          <label for="school">School</label>
          <input v-model="schoolName" id="school" type="text" placeholder="Enter your school name" class="input" />
        </div>

        <!-- Email -->
        <div class="form-group">
          <label for="email">Email</label>
          <input v-model="email" id="email" type="email" placeholder="Enter your email" class="input" />
        </div>

        <!-- Password -->
        <div class="form-group input-group">
          <label for="password">Password</label>
          <input v-model="password" id="password" :type="showPassword ? 'text' : 'password'" placeholder="Enter your password" class="input" />
          <span class="toggle" @click="showPassword = !showPassword">{{ showPassword ? 'Hide' : 'Show' }}</span>
        </div>

        <!-- Confirm Password -->
        <div class="form-group input-group">
          <label for="confirmPassword">Confirm Password</label>
          <input v-model="confirmPassword" id="confirmPassword" :type="showConfirmPassword ? 'text' : 'password'" placeholder="Confirm your password" class="input" />
          <span class="toggle" @click="showConfirmPassword = !showConfirmPassword">{{ showConfirmPassword ? 'Hide' : 'Show' }}</span>
        </div>

        <!-- Submit Button -->
        <button type="submit" class="btn btn-primary w-full mt-4">
          <span v-if="!loading">Register</span>
          <span v-else class="spinner"></span>
        </button>
      </form>

      <p class="login-link mt-4">
        Already have an account? <router-link to="/" class="link">Login</router-link>
      </p>
    </div>
  </div>
</template>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  transition: background 0.3s;
}

.register-page.light {
  background: linear-gradient(135deg, #34d399, #3b82f6);
}

.register-page.dark {
  background: #1f2937;
  color: #f9fafb;
}

.card {
  background: white;
  padding: 4rem;
  border-radius: 12px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition: background 0.3s, color 0.3s;
}

.register-page.dark .card {
  background: #111827;
  color: #f9fafb;
}

.title {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 1rem;
  text-align: center;
}

/* Form grid layout */
.form-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

label {
  font-size: 0.875rem;
  font-weight: 500;
}

/* Input */
.input {
  width: 100%;
  padding: 0.65rem 1rem;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  outline: none;
  transition: border 0.2s, box-shadow 0.2s;
  font-size: 0.95rem;
}

.input:focus {
  border-color: #16a34a;
  box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.2);
}

/* Password toggle */
.input-group {
  position: relative;
}

.toggle {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  font-size: 0.85rem;
  color: #16a34a;
  user-select: none;
}

/* Buttons */
.btn {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.65rem 1rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  border: none;
  transition: background 0.2s, transform 0.2s;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn-primary {
  background: #16a34a;
  color: white;
}
.btn-primary:hover {
  background: #15803d;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Alerts */
.alert {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  text-align: center;
}

.alert-error {
  background: #fee2e2;
  color: #b91c1c;
  border-left: 4px solid #dc2626;
}

.alert-success {
  background: #d1fae5;
  color: #065f46;
  border-left: 4px solid #16a34a;
}

/* Dark mode toggle */
.dark-toggle {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 0.5rem;
}

.login-link {
  text-align: center;
  margin-top: 1rem;
}

.link {
  color: #16a34a;
  font-weight: 500;
}
.link:hover {
  text-decoration: underline;
}

/* Responsive */
@media (max-width: 500px) {
  .card {
    padding: 1.5rem;
  }
}
</style>