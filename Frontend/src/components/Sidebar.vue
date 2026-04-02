<script setup>
import { computed } from "vue";

const storedUser = sessionStorage.getItem("user");
const user = storedUser ? JSON.parse(storedUser) : null;

const menu = computed(() => {
  if (!user) return [];

  const roles = {
    admin: "/dashboard/admin",
    teacher: "/dashboard/teacher",
    student: "/dashboard/student",
    parent: "/dashboard/parent",
  };
  
  return [{ name: "Dashboard", path: roles[user.role] }];
});
</script>

<template>
  <div class="sidebar">
    <h2 class="sidebar-title">School System</h2>
    <ul class="sidebar-menu">
      <li v-for="item in menu" :key="item.path">
        <router-link :to="item.path" class="menu-item" active-class="active">
          {{ item.name }}
        </router-link>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.sidebar {
  width: 220px;
  min-height: 100vh;
  background-color: #1f2937;
  color: #ffffff;
  padding: 1rem;
}

.sidebar-title {
  font-size: 1.25rem;
  font-weight: bold;
  margin-bottom: 1rem;
  border-bottom: 1px solid #374151;
  padding-bottom: 0.5rem;
}

.sidebar-menu {
  list-style: none;
  padding: 0;
  margin: 0;
}

.menu-item {
  display: block;
  padding: 0.6rem 0.8rem;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.menu-item:hover {
  background-color: #374151;
}

.active {
  background-color: #4b5563;
}
</style>