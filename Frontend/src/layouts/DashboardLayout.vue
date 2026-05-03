<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import Sidebar from "@/components/Sidebar.vue";
import Navbar from "@/components/Navbar.vue";
import socket from "@/socket";
import { useAuthStore } from "@/store/authStore";
import { getSubscriptionStatus } from "@/services/authService";
import { getMySchool } from "@/services/schoolService";

const sidebarOpen = ref(false);
const auth = useAuthStore();

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};

const closeSidebar = () => {
  sidebarOpen.value = false;
};

const syncSubscriptionState = async () => {
  if (!auth.user?._id) {
    return;
  }

  try {
    if (auth.user.role === "admin") {
      const response = await getSubscriptionStatus();
      auth.updateSchool(response.school);
      auth.updateSubscription(response.subscription);
      return;
    }

    const response = await getMySchool();
    auth.updateSchool(response.school);
  } catch {
    // The backend remains the source of truth. Ignore sync failures here.
  }
};

onMounted(() => {
  syncSubscriptionState();
  socket.on("subscriptionUpdated", syncSubscriptionState);
  window.addEventListener("focus", syncSubscriptionState);
});

onUnmounted(() => {
  socket.off("subscriptionUpdated", syncSubscriptionState);
  window.removeEventListener("focus", syncSubscriptionState);
});
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
