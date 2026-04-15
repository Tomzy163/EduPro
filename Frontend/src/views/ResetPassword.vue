<script setup>
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { resetPassword } from "../services/authService";

const route = useRoute();
const router = useRouter();

const password = ref("");
const confirmPassword = ref("");
const loading = ref(false);
const error = ref("");
const success = ref("");

const token = computed(() => String(route.query.token || ""));

const submit = async () => {
  if (!token.value) {
    error.value = "This reset link is invalid or missing.";
    return;
  }

  if (password.value.length < 6) {
    error.value = "Password must be at least 6 characters.";
    return;
  }

  if (password.value !== confirmPassword.value) {
    error.value = "Passwords do not match.";
    return;
  }

  loading.value = true;
  error.value = "";
  success.value = "";

  try {
    const data = await resetPassword({
      token: token.value,
      password: password.value,
    });

    success.value = data.message || "Password reset successful.";
    password.value = "";
    confirmPassword.value = "";

    setTimeout(() => {
      router.push("/");
    }, 1200);
  } catch (err) {
    error.value = err.response?.data?.message || "Unable to reset your password.";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="auth-shell">
    <div class="auth-card">
      <p class="eyebrow">Secure Access</p>
      <h1>Reset Password</h1>
      <p class="copy">
        Create a new password for your account and return to the login page.
      </p>

      <p v-if="error" class="banner danger">{{ error }}</p>
      <p v-if="success" class="banner success">{{ success }}</p>

      <input
        v-model="password"
        type="password"
        placeholder="New password"
        class="input-field"
      />

      <input
        v-model="confirmPassword"
        type="password"
        placeholder="Confirm new password"
        class="input-field"
      />

      <button :disabled="loading" @click="submit" class="submit-btn">
        {{ loading ? "Resetting..." : "Reset Password" }}
      </button>

      <router-link to="/" class="back-link">Back to login</router-link>
    </div>
  </div>
</template>

<style scoped>
.auth-shell {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background:
    radial-gradient(circle at top right, rgba(15, 118, 110, 0.18), transparent 34%),
    linear-gradient(180deg, #f8fafc, #dbeafe);
}

.auth-card {
  width: 100%;
  max-width: 460px;
  padding: 36px;
  background: rgba(255, 255, 255, 0.96);
  border-radius: 24px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.12);
  display: grid;
  gap: 16px;
}

.eyebrow {
  margin: 0;
  color: #0f766e;
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

h1 {
  margin: 0;
}

.copy {
  margin: 0;
  color: #64748b;
}

.input-field {
  width: 100%;
  padding: 13px 15px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 14px;
  font-size: 0.98rem;
}

.submit-btn {
  width: 100%;
  padding: 13px 16px;
  border: none;
  border-radius: 14px;
  background: #0f766e;
  color: white;
  font-weight: 700;
  cursor: pointer;
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: wait;
}

.banner {
  margin: 0;
  padding: 12px 14px;
  border-radius: 14px;
  font-weight: 600;
}

.success {
  background: rgba(22, 163, 74, 0.12);
  color: #166534;
}

.danger {
  background: rgba(220, 38, 38, 0.12);
  color: #991b1b;
}

.back-link {
  justify-self: start;
  color: #1d4ed8;
  font-weight: 700;
}
</style>
