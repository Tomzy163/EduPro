<script setup>
import { ref } from "vue";
import { forgotPassword } from "../services/authService";

const school = ref("");
const email = ref("");
const phoneNumber = ref("");
const loading = ref(false);
const error = ref("");
const success = ref("");
const resetLink = ref("");
const previewUrl = ref("");

const submit = async () => {
  if (!school.value || (!email.value && !phoneNumber.value)) {
    error.value = "Enter your school name and at least an email address or phone number.";
    return;
  }

  loading.value = true;
  error.value = "";
  success.value = "";
  resetLink.value = "";
  previewUrl.value = "";

  try {
    const data = await forgotPassword({
      email: email.value,
      phoneNumber: phoneNumber.value,
      school: school.value,
    });

    success.value = data.message || "Reset instructions sent successfully.";
    resetLink.value = data.resetLink || "";
    previewUrl.value = data.previewUrl || "";
    email.value = "";
  } catch (err) {
    resetLink.value = err.response?.data?.resetLink || "";
    previewUrl.value = err.response?.data?.previewUrl || "";
    error.value = err.response?.data?.message || "Unable to send reset instructions.";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="auth-shell">
    <div class="auth-card">
      <p class="eyebrow">Account Recovery</p>
      <h1>Forgot Password</h1>
      <p class="copy">
        Enter the school name and email attached to your account. We will send a secure reset email, and SMS can be used when a phone number is available.
      </p>

      <p v-if="error" class="banner danger">{{ error }}</p>
      <p v-if="success" class="banner success">{{ success }}</p>

      <input
        v-model="school"
        type="text"
        placeholder="School name"
        class="input-field"
      />

      <input
        v-model="email"
        type="email"
        placeholder="Email address"
        class="input-field"
      />

      <input
        v-model="phoneNumber"
        type="text"
        placeholder="Phone number (optional for SMS)"
        class="input-field"
      />

      <button :disabled="loading" @click="submit" class="submit-btn">
        {{ loading ? "Sending..." : "Send Reset Link" }}
      </button>

      <div v-if="previewUrl" class="preview">
        <strong>Email Preview</strong>
        <p class="preview-copy">
          SMTP is not fully configured on this machine, so the reset email was saved to a local preview for testing.
        </p>
        <a :href="previewUrl" target="_blank" rel="noreferrer">Open local email preview</a>
      </div>

      <div v-if="resetLink" class="preview">
        <strong>Reset Link</strong>
        <p class="preview-copy">
          Use this link only for local development if direct delivery is unavailable.
        </p>
        <a :href="resetLink">{{ resetLink }}</a>
      </div>

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
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.16), transparent 32%),
    linear-gradient(180deg, #f8fafc, #e2e8f0);
}

.auth-card {
  width: 100%;
  max-width: 460px;
  padding: 36px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.12);
  display: grid;
  gap: 16px;
}

.eyebrow {
  margin: 0;
  color: #1d4ed8;
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
  background: #2563eb;
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

.preview {
  padding: 14px;
  border-radius: 16px;
  background: rgba(37, 99, 235, 0.08);
  display: grid;
  gap: 6px;
}

.preview-copy {
  margin: 0;
  color: #475569;
}

.preview a {
  word-break: break-all;
  color: #1d4ed8;
}

.back-link {
  justify-self: start;
  color: #0f766e;
  font-weight: 700;
}
</style>
