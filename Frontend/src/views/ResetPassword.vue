<script setup>
import { ref } from "vue";
import { resetPassword } from "../services/authService";

const token = ref("");
const password = ref("");

const submit = async () => {
  await resetPassword({
    token: token.value,
    password: password.value,
  });

  alert("Password reset successful");
};
</script>

<template>
  <div class="flex justify-center items-center h-screen">
    <div class="bg-white p-6 shadow rounded">
      <h2>Reset Password</h2>

      <input v-model="token" placeholder="Token" class="border p-2 mb-2" />
      <input v-model="password" placeholder="New Password" class="border p-2 mb-3" />

      <button @click="submit" class="bg-green-500 text-white p-2 w-full">
        Reset Password
      </button>
    </div>
  </div>
</template>