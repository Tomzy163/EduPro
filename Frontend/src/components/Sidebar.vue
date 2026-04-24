<script setup>
import { computed } from "vue";
import { useAuthStore } from "@/store/authStore";

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close"]);
const auth = useAuthStore();

const roleMenu = {
  admin: [
    { name: "Overview", path: "/dashboard/admin" },
    { name: "AI Insights", path: "/dashboard/admin/ai-insights" },
    { name: "Report Comments", path: "/dashboard/admin/report-comments" },
    { name: "Subscription", path: "/subscription" },
  ],
  teacher: [
    { name: "Overview", path: "/dashboard/teacher" },
    { name: "Exam Generator", path: "/dashboard/teacher/exam-generator" },
    { name: "Report Comments", path: "/dashboard/teacher/report-comments" },
  ],
  student: [
    { name: "Overview", path: "/dashboard/student" },
    { name: "AI Tutor", path: "/dashboard/student/ai-tutor" },
  ],
  parent: [
    { name: "Overview", path: "/dashboard/parent" },
    { name: "AI Assistant", path: "/dashboard/parent/ai-assistant" },
  ],
};

const menu = computed(() => roleMenu[auth.user?.role] || []);
</script>

<template>
  <div v-if="open" class="sidebar-overlay" @click="emit('close')" />

  <aside class="sidebar" :class="{ 'sidebar-open': open }">
    <div class="sidebar-head">
      <div>
        <p class="sidebar-eyebrow">EduPro School OS</p>
        <h2 class="sidebar-title">{{ auth.school?.name || "School Portal" }}</h2>
      </div>
      <button type="button" class="sidebar-close" @click="emit('close')">
        Close
      </button>
    </div>

    <nav class="sidebar-nav">
      <router-link
        v-for="item in menu"
        :key="item.path"
        :to="item.path"
        class="menu-item"
        active-class="active"
        @click="emit('close')"
      >
        {{ item.name }}
      </router-link>
    </nav>

    <div class="sidebar-foot">
      <span class="plan-label">Plan</span>
      <strong>{{ auth.school?.subscription?.plan || auth.user?.subscription?.plan || "trial" }}</strong>
    </div>
  </aside>
</template>

<style scoped>
.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  z-index: 39;
}

.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 40;
  display: flex;
  flex-direction: column;
  width: 280px;
  min-height: 100vh;
  padding: 26px 18px;
  color: #fff;
  background:
    radial-gradient(circle at top, rgba(34, 197, 94, 0.18), transparent 28%),
    linear-gradient(180deg, #0f172a 0%, #10213a 100%);
  box-shadow: 28px 0 60px rgba(15, 23, 42, 0.22);
}

.sidebar-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 24px;
}

.sidebar-eyebrow,
.plan-label {
  margin: 0 0 6px;
  color: rgba(226, 232, 240, 0.72);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.74rem;
}

.sidebar-title {
  margin: 0;
  font-family: "Outfit", sans-serif;
  font-size: 1.4rem;
}

.sidebar-nav {
  display: grid;
  gap: 10px;
}

.menu-item {
  display: block;
  padding: 12px 14px;
  border-radius: 16px;
  color: rgba(241, 245, 249, 0.9);
  transition: background 0.2s ease, transform 0.2s ease;
}

.menu-item:hover,
.active {
  background: rgba(255, 255, 255, 0.12);
  transform: translateX(2px);
}

.sidebar-foot {
  margin-top: auto;
  padding-top: 24px;
}

.sidebar-close {
  display: none;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  padding: 10px 12px;
  font-weight: 700;
}

@media (max-width: 960px) {
  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.25s ease;
  }

  .sidebar-open {
    transform: translateX(0);
  }

  .sidebar-close {
    display: inline-flex;
  }
}
</style>
