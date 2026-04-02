<script setup>
import { useRoute } from "vue-router";
// import Sidebar from "./components/Sidebar.vue";
// import Navbar from "./components/Navbar.vue";

const route = useRoute();
</script>

<template>
  <div>
    <!-- ❌ Hide on login/register pages -->
    <div v-if="route.path !== '/' && route.path !== '/register' && route.path !== '/forgot-password' && route.path !== '/reset-password'" class="flex">
      
      <!-- <Sidebar /> -->

      <div class="flex-1 bg-gray-100 min-h-screen">
        <!-- <Navbar /> -->

        <div class="p-6">
          <router-view />
        </div>
      </div>
    </div>

    <!-- ✅ Only show page (no sidebar/navbar) -->
    <div v-else>
      <router-view />
    </div>
  </div>
</template>

<style>
input, select {
  display: block;
  margin: 5px 0;
  padding: 8px;
}

button {
  padding: 8px;
  margin-top: 5px;
  cursor: pointer;
}
</style>
