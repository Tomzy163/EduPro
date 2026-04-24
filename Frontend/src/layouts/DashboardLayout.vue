<script setup>
import { ref } from "vue";
import Sidebar from "@/components/Sidebar.vue";
import Navbar from "@/components/Navbar.vue";

const sidebarOpen = ref(false);

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};

const closeSidebar = () => {
  sidebarOpen.value = false;
};
</script>

<template>
  <div class="layout-container">
    <Sidebar :open="sidebarOpen" @close="closeSidebar" />

    <div class="main-content">
      <Navbar @toggle-sidebar="toggleSidebar" />

      <div class="page-content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<style scoped>
.layout-container {
  display: flex;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  min-height: 100vh;
  margin-left: 280px;
}

.page-content {
  padding: 22px 24px 32px;
}

@media (max-width: 960px) {
  .main-content {
    margin-left: 0;
  }

  .page-content {
    padding: 16px;
  }
}
</style>
