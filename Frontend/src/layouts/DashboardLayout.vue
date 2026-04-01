<script setup>
import Sidebar from "../components/Sidebar.vue";
import Navbar from "../components/Navbar.vue";
</script>

<template>
  <div class="layout-container">
    <Sidebar />

    <div class="main-content">
      <Navbar />

      <div class="page-content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<style scoped>
.layout-container {
  display: flex;
}

.main-content {
  flex: 1;
  min-height: 100vh;
  background-color: #f4f7fa;
}

.page-content {
  padding: 24px;
}
</style>