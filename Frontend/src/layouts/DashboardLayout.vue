<script setup>
import Sidebar from "../components/Sidebar.vue";
import Navbar from "../components/Navbar.vue";
</script>

<template>
  <div class="flex">
    <Sidebar />

    <div class="flex-1 bg-gray-100 min-h-screen">
      <Navbar />

      <div class="p-6">
        <router-view />
      </div>
    </div>
  </div>
</template>