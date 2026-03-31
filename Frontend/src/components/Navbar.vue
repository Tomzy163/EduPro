<script setup>
import { useAuthStore } from "../store/authStore";

const auth = useAuthStore(); // ✅ safe now because Pinia is registered first
</script>

<template>
  <div class="flex justify-between items-center bg-white shadow p-4">
    <h1 class="text-xl font-bold">EduPro</h1>
    <span>{{ auth.user?.school }}</span>
    <div>
      <span class="mr-4">Hello, {{ auth.user.name }}</span>
      <button
        class="bg-red-500 text-white px-3 py-1 rounded"
        @click="auth.logout()"
      >
        Logout
      </button>
    </div>
  </div>

  <div class="flex justify-between items-center bg-white shadow p-4"> 
    <h1 class="text-lg font-semibold">Dashboard</h1>

  </div>
</template>