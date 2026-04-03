<script setup>
import { ref } from "vue";
import { forgotPassword } from "../services/authService";

const email = ref("");
const error = ref("");
const school = ref("");
const token = ref("");
const loading = ref(false);

const submit = async () => {
   loading.value = true;
  try {
    await forgotPassword({ email: email.value, school: school.value });
    alert("Reset link sent to your email 📩");
    email.value = "";
    school.value = "";
  } catch (err) {
    console.log("FULL ERROR:", err);
    error.value = err.response?.data?.message || "Error sending reset link";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="forgot-container">
    <div class="forgot-card">
      <h2>Forgot Password</h2>

      <p v-if="error" class="error">{{ error }}</p>

            <input
        v-model="school"
        type="text"
        placeholder="Enter your school name"
        class="input-field"
      />

      <input
        v-model="email"
        type="email"
        placeholder="Enter your email"
        class="input-field"
      />

      <button :disabled="loading" @click="submit" class="submit-btn">
        {{ loading ? "Sending..." : "Get Reset Link" }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.forgot-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f4f7fa;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}

.forgot-card {
  background-color: #ffffff;
  padding: 40px 45px;
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.forgot-card h2 {
  font-size: 24px;
  color: #333333;
  margin-bottom: 30px;
  font-weight: 600;
}

.input-field {
  width: 100%;
  padding: 12px 15px;
  margin-bottom: 20px;
  border: 1px solid #cccccc;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s;
}

.input-field:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 5px rgba(59, 130, 246, 0.3);
}

.submit-btn {
  width: 100%;
  padding: 12px;
  background-color: #3b82f6;
  color: white;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
}

.submit-btn:hover {
  background-color: #2563eb;
  transform: translateY(-1px);
}

.submit-btn:active {
  transform: translateY(1px);
}
</style>