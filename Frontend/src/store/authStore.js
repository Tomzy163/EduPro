import { defineStore } from "pinia";
import { register } from "../services/authService";
import router from "../router";
import { connectSocket, disconnectSocket } from "../services/socket";
import API from "../services/api";

const getStoredUser = () => {
  try {
    const raw = sessionStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: getStoredUser(),
    token: sessionStorage.getItem("token") || null,
  }),

  actions: {
    async loginUser(credentials) {
      try {
        const res = await API.post("/auth/login", credentials);
        const { user, token } = res.data;

        this.user = user;
        this.token = token;

        sessionStorage.setItem("token", token);
        sessionStorage.setItem("user", JSON.stringify(user));

        connectSocket(user?._id || user?.id);
        return res.data;
      } catch (err) {
        throw err.response?.data || { message: "Login failed" };
      }
    },

    async registerUser(data) {
      try {
        return await register(data);
      } catch (err) {
        throw err.response?.data || { message: "Register failed" };
      }
    },

    logout() {
      this.user = null;
      this.token = null;
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("token");
      disconnectSocket();
      router.push("/");
    },
  },
});
