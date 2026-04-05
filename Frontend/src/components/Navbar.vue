<script setup>
import { useAuthStore } from "../store/authStore";
// import { useRouter } from "vue-router";
// const router = useRouter();

// const logout = () => {
//   auth.logout();
//   router.push("/");
// };

const auth = useAuthStore();
</script>

<template>
  <div class="navbar">
    <div class="navbar-top">
      <h1 class="app-title"> 🎓 EduPro</h1>
          <span class="school-name">
      {{ auth.user?.school || "" }}
    </span>
      <div class="user-actions">
            <span class="welcome-msg">
      Hello, {{ auth.user?.name || "User" }}
    </span>
        <button class="logout-btn" @click="auth.logout()">Logout</button>
      </div>
    </div>

    <!-- <div class="navbar-bottom">
      <h1 class="dashboard-title">Dashboard</h1>
    </div> -->
  </div>
</template>

<style scoped>
.navbar {
  background-color: #ffffff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  padding: 1rem 2rem;
}

.navbar-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.app-title {
  font-size: 1.5rem;
  font-weight: bold;
}

.school-name {
  font-family: Cambria, Cochin, Georgia, Times, 'Times New Roman', serif;
  font-weight: bolder;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 2rem;
  color: #555555;
}

.user-actions {
  display: flex;
  align-items: center;
}

.welcome-msg {
  margin-right: 1rem;
  font-weight: 800;
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