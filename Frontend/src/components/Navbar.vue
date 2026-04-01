<script setup>
import { useAuthStore } from "../store/authStore";

const auth = useAuthStore();
</script>

<template>
  <div class="navbar">
    <div class="navbar-top">
      <h1 class="app-title">EduPro</h1>
      <span class="school-name">{{ auth.user?.school }}</span>
      <div class="user-actions">
        <span class="welcome-msg">Hello, {{ auth.user.name }}</span>
        <button class="logout-btn" @click="auth.logout()">Logout</button>
      </div>
    </div>

    <div class="navbar-bottom">
      <h1 class="dashboard-title">Dashboard</h1>
    </div>
  </div>
</template>

<style scoped>
.navbar {
  background-color: #ffffff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  padding: 0.5rem 1rem;
}

.navbar-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.app-title {
  font-size: 1.25rem;
  font-weight: bold;
}

.school-name {
  font-size: 1rem;
  color: #555555;
}

.user-actions {
  display: flex;
  align-items: center;
}

.welcome-msg {
  margin-right: 1rem;
  font-weight: 500;
}

.logout-btn {
  background-color: #ef4444;
  color: white;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.logout-btn:hover {
  background-color: #dc2626;
}

.navbar-bottom {
  border-top: 1px solid #e5e7eb;
  padding-top: 0.5rem;
}

.dashboard-title {
  font-size: 1.125rem;
  font-weight: 600;
}
</style>