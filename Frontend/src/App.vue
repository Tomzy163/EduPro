<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

const authRoutes = new Set([
  "/",
  "/register",
  "/forgot-password",
  "/reset-password",
]);

const showShell = computed(() => !authRoutes.has(route.path));
</script>

<template>
  <main class="app-shell">
    <section v-if="showShell" class="dashboard-shell">
      <div class="dashboard-shell__content">
        <router-view />
      </div>
    </section>

    <router-view v-else />
  </main>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
}

.dashboard-shell {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(14, 165, 233, 0.12), transparent 32%),
    radial-gradient(circle at bottom right, rgba(245, 158, 11, 0.14), transparent 24%),
    linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%);
}

.dashboard-shell__content {
  min-height: 100vh;
}
</style>
