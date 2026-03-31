import { defineStore } from "pinia";
import { login } from "../services/authService";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: JSON.parse(localStorage.getItem("user")) || null,
  }),

  actions: {
    async loginUser(credentials) {
      const data = await login(credentials);
      this.user = data;
      localStorage.setItem("user", JSON.stringify(data));
    },

    logout() {
      this.user = null;
      localStorage.removeItem("user");
    },
  },
});