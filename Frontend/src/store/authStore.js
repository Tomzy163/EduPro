// store/authStore.js
import { defineStore } from "pinia";
import { login, register } from "../services/authService";
import router from "../router"; // ✅ import router directly

export const useAuthStore = defineStore("auth", {
  state: () => {
    // Safely parse stored user
    let storedUser = null;
    try {
      const raw = sessionStorage.getItem("user");
      storedUser = raw ? JSON.parse(raw) : null;
    } catch {
      storedUser = null;
    }

    return {
      user: storedUser,
      token: sessionStorage.getItem("token") || null,
    };
  },

  actions: {
    async loginUser(data) {
  try {
    const res = await login(data);

    this.user = res.user; // ✅ backend user object
    this.token = res.token;

    // Save to sessionStorage correctly
    sessionStorage.setItem("user", JSON.stringify(res.user));
    sessionStorage.setItem("token", res.token);

    return res;
  } catch (err) {
    console.error("Login error:", err); // 🔥 log backend error
    throw err.response?.data || { message: "Login failed" };
  }
},

    async registerUser(data) {
      try {
        const res = await register(data);
        return res;
      } catch (err) {
        throw err.response?.data || { message: "Register failed" };
      }
    },

    logout() {
      this.user = null;
      this.token = null;
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("token");
      router.push("/"); // ✅ use imported router
    },
  },
});