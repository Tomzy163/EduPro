<script setup>
import { ref } from "vue";
import { forgotPassword } from "../services/authService";

const email = ref("");
const token = ref("");

const submit = async () => {
  const res = await forgotPassword(email.value);
  token.value = res.token;

  alert("Token: " + token.value); // later replace with email
};
</script>

<template>
  <div class="flex justify-center items-center h-screen">
    <div class="bg-white p-6 shadow rounded">
      <h2>Forgot Password</h2>

      <input v-model="email" placeholder="Email" class="border p-2 mb-3" />

      <button @click="submit" class="bg-blue-500 text-white p-2 w-full">
        Get Reset Token
      </button>
    </div>
  </div>
</template>