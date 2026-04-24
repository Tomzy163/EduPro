<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import ThemeToggle from "@/components/ThemeToggle.vue";
import { useAuthStore } from "@/store/authStore";

defineEmits(["toggle-sidebar"]);

const auth = useAuthStore();
const route = useRoute();

const schoolName = computed(() => auth.school?.name || auth.user?.school || "EduPro");
const portalName = computed(() => auth.school?.portalName || "EduPro");
const displayName = computed(() => auth.user?.name || "User");
const pageTitle = computed(() => route.meta?.title || "Dashboard");
const brandStyle = computed(() => ({
  background: `linear-gradient(135deg, ${auth.school?.primaryColor || "#0f766e"}, ${auth.school?.accentColor || "#1d4ed8"})`,
}));
</script>

<template>
  <header class="navbar">
    <div class="nav-leading">
      <button type="button" class="menu-toggle" @click="$emit('toggle-sidebar')">
        Menu
      </button>

      <div class="brand">
        <span class="brand-mark" :style="brandStyle">EP</span>
        <div>
          <h1 class="brand-title">{{ portalName }}</h1>
          <p class="brand-subtitle">{{ schoolName }}</p>
        </div>
      </div>
    </div>

    <div class="nav-center">
      <span class="nav-label">Current workspace</span>
      <strong>{{ pageTitle }}</strong>
    </div>

    <div class="user-actions">
      <ThemeToggle />
      <div class="user-copy">
        <span class="welcome-label">Signed in as</span>
        <strong>{{ displayName }}</strong>
      </div>
      <button class="logout-btn" @click="auth.logout()">Logout</button>
    </div>
  </header>
</template>

<style scoped>
.navbar {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  align-items: center;
  padding: 18px 24px;
  margin: 20px 24px 0;
  border: 1px solid var(--line);
  border-radius: 26px;
  background: var(--surface);
  backdrop-filter: blur(18px);
  box-shadow: var(--shadow-soft);
}

.nav-leading,
.user-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.nav-center {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.nav-label,
.welcome-label,
.brand-subtitle {
  color: var(--text-soft);
  font-size: 0.82rem;
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  border-radius: 16px;
  background: linear-gradient(135deg, #0f766e, #1d4ed8);
  color: #fff;
  font-family: "Outfit", sans-serif;
  font-weight: 800;
  letter-spacing: 0.06em;
}

.brand-title {
  margin: 0;
  font-family: "Outfit", sans-serif;
  font-size: 1.35rem;
  font-weight: 800;
}

.user-copy {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.logout-btn,
.menu-toggle {
  border: none;
  border-radius: 999px;
  padding: 11px 16px;
  font-weight: 700;
}

.logout-btn {
  background: #dc2626;
  color: #fff;
}

.menu-toggle {
  display: none;
  background: rgba(15, 118, 110, 0.12);
  color: var(--text-main);
}

@media (max-width: 960px) {
  .navbar {
    grid-template-columns: 1fr;
    margin: 16px;
    padding: 16px;
  }

  .nav-center,
  .user-copy {
    align-items: flex-start;
  }

  .menu-toggle {
    display: inline-flex;
  }

  .user-actions {
    flex-wrap: wrap;
  }
}
</style>
