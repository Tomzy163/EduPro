import { defineStore } from "pinia";
import { login } from "../services/authService";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: JSON.parse(sessionStorage.getItem("user")) || null,
  }),

  actions: {
    async loginUser(credentials) {
      const data = await login(credentials);
      this.user = data;

      sessionStorage.setItem("user", JSON.stringify(data)); // ✅ changed
    },

    logout() {
      this.user = null;
      sessionStorage.removeItem("user"); // ✅ changed
    },
  },
});