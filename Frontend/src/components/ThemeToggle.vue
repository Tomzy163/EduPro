<script setup>
import { computed, onMounted } from "vue";
import { useUiStore } from "@/store/uiStore";

const ui = useUiStore();
const label = computed(() => (ui.theme === "dark" ? "Light mode" : "Dark mode"));

onMounted(() => {
  ui.applyTheme(ui.theme);
});
</script>

<template>
  <button type="button" class="theme-toggle" @click="ui.toggleTheme()">
    {{ label }}
  </button>
</template>

<style scoped>
.theme-toggle {
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.6);
  color: var(--text-main);
  padding: 10px 14px;
  font-weight: 700;
}
</style>
