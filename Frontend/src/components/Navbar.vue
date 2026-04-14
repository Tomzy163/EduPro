<script setup>
import { computed } from "vue";
import { useAuthStore } from "../store/authStore";

const auth = useAuthStore();

const schoolName = computed(() => auth.user?.school || "EduPro");
const displayName = computed(() => auth.user?.name || "User");
</script>

<template>
  <header class="navbar">
    <div class="brand">
      <span class="brand-mark">EP</span>
      <div>
        <h1 class="brand-title">EduPro</h1>
        <p class="brand-subtitle">{{ schoolName }}</p>
      </div>
    </div>

    <div class="user-actions">
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 18px 24px;
  margin: 0 24px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(14px);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
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
  font-size: 1.4rem;
  font-weight: 800;
}

.brand-subtitle {
  margin: 4px 0 0;
  color: #5f728c;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.8rem;
  font-weight: 700;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.user-copy {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.welcome-label {
  color: #5f728c;
  font-size: 0.82rem;
}

.logout-btn {
  border: none;
  border-radius: 999px;
  background: #dc2626;
  color: #fff;
  padding: 11px 18px;
  font-weight: 700;
}

@media (max-width: 768px) {
  .navbar {
    margin: 0 16px;
    padding: 16px;
    flex-direction: column;
    align-items: flex-start;
  }

  .user-actions,
  .user-copy {
    align-items: flex-start;
  }
}
</style>
