// store/authStore.js
import { defineStore } from "pinia";
import { login, register } from "../services/authService";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: JSON.parse(sessionStorage.getItem("user")) || null,
    token: sessionStorage.getItem("token") || null,
  }),

  actions: {
    async loginUser(data) {
      try {
        const res = await login(data);

        this.user = res.user;
        this.token = res.token;

        // Save to sessionStorage
        sessionStorage.setItem("user", JSON.stringify(res.user));
        sessionStorage.setItem("token", res.token);

        return res;
      } catch (err) {
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
      sessionStorage.clear();
    },
  },
});