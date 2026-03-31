<script setup>
import { computed } from "vue";

const user = JSON.parse(localStorage.getItem("user"));

// Dynamic menu based on role
const menu = computed(() => {
  if (!user) return [];

  if (user.role === "admin") {
    return [
      { name: "Dashboard", path: "/admin" },
    ];
  }

  if (user.role === "teacher") {
    return [
      { name: "Dashboard", path: "/teacher" },
    ];
  }

  if (user.role === "student") {
    return [
      { name: "Dashboard", path: "/student" },
    ];
  }

  if (user.role === "parent") {
    return [
      { name: "Dashboard", path: "/parent" },
    ];
  }

  return [];
});
</script>

<template>
  <div class="w-64 h-screen bg-gray-900 text-white p-4">
    <h2 class="text-xl font-bold mb-6 border-b border-gray-700 pb-2">
  School System
</h2>

    <ul class="space-y-3">
      <li v-for="item in menu" :key="item.path">
        <router-link
          :to="item.path"
          class="block p-2 rounded hover:bg-gray-700"
          active-class="bg-gray-700"
        >
          {{ item.name }}
        </router-link>
      </li>
    </ul>
  </div>
</template>