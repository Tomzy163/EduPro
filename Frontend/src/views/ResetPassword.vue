<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { resetPassword } from "../services/authService";

const route = useRoute();

const token = ref("");
const password = ref("");
const loading = ref(false);

// get token from URL
onMounted(() => {
  if (route.query.token) {
    token.value = route.query.token;
  }
});

const submit = async () => {
  try {
    loading.value = true;

    await resetPassword({
      token: token.value,
      password: password.value,
    });

    alert("Password reset successful ✅");

    token.value = "";
    password.value = "";
  } catch (err) {
    alert(err.response?.data?.message || "Error resetting password");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="reset-container">
    <div class="reset-card">
      <h2>Reset Password</h2>

      <p v-if="error" class="error">{{ error }}</p>

      <!-- <input
        v-model="token"
        type="text"
        placeholder="Token"
        class="input-field"
      /> -->
            <input
        v-model="password"
        type="password"
        placeholder="New Password"
      />

      <button :disabled="loading" @click="submit" class="submit-btn">
        {{ loading ? "Sending..." : "Get Reset Link" }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.reset-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f4f7fa;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}

.reset-card {
  background-color: #ffffff;
  padding: 40px 30px;
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.reset-card h2 {
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
  border-color: #4caf50;
  box-shadow: 0 0 5px rgba(76, 175, 80, 0.3);
}

.submit-btn {
  width: 100%;
  padding: 12px;
  background-color: #4caf50;
  color: white;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
}

.submit-btn:hover {
  background-color: #45a049;
  transform: translateY(-1px);
}

.submit-btn:active {
  transform: translateY(1px);
}
</style>