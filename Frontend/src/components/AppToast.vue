<script setup>
import { storeToRefs } from "pinia";
import { useUiStore } from "@/store/uiStore";

const ui = useUiStore();
const { toasts } = storeToRefs(ui);
</script>

<template>
  <teleport to="body">
    <div class="toast-stack">
      <article
        v-for="toast in toasts"
        :key="toast.id"
        class="toast-card"
        :class="`toast-${toast.tone}`"
      >
        <div class="toast-copy">
          <strong>{{ toast.title }}</strong>
          <p>{{ toast.message }}</p>
        </div>
        <button type="button" class="toast-close" @click="ui.dismissToast(toast.id)">
          Close
        </button>
      </article>
    </div>
  </teleport>
</template>

<style scoped>
.toast-stack {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 80;
  display: grid;
  gap: 12px;
  width: min(360px, calc(100vw - 24px));
}

.toast-card {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid var(--line);
  background: var(--surface);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(16px);
}

.toast-copy p {
  margin: 6px 0 0;
  color: var(--text-soft);
}

.toast-close {
  border: none;
  background: transparent;
  color: var(--text-soft);
  font-weight: 700;
}

.toast-success {
  border-color: rgba(21, 128, 61, 0.25);
}

.toast-error {
  border-color: rgba(220, 38, 38, 0.25);
}

.toast-info {
  border-color: rgba(37, 99, 235, 0.22);
}
</style>
