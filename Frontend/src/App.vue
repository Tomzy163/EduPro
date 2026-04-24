<script setup>
import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import AppToast from "@/components/AppToast.vue";
import { useUiStore } from "@/store/uiStore";

const route = useRoute();
const ui = useUiStore();

const authRoutes = new Set([
  "/",
  "/register",
  "/forgot-password",
  "/reset-password",
]);

const showShell = computed(() => !authRoutes.has(route.path));

onMounted(() => {
  ui.applyTheme(ui.theme);
});
</script>

<template>
  <main class="app-shell">
    <AppToast />

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
