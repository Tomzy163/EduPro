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

const getStoredSchool = () => {
  try {
    const raw = sessionStorage.getItem("school");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: getStoredUser(),
    token: sessionStorage.getItem("token") || null,
    school: getStoredSchool(),
  }),

  actions: {
    async loginUser(credentials) {
      try {
        const res = await API.post("/auth/login", credentials);
        const { user, token, school } = res.data;

        this.user = user;
        this.token = token;
        this.school = school || null;

        sessionStorage.setItem("token", token);
        sessionStorage.setItem("user", JSON.stringify(user));
        sessionStorage.setItem("school", JSON.stringify(school || null));

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
      this.school = null;
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("school");
      disconnectSocket();
      router.push("/");
    },

    updateSubscription(subscription) {
      if (!this.user) {
        return;
      }

      this.user = {
        ...this.user,
        subscription,
      };

      if (this.school) {
        this.school = {
          ...this.school,
          subscription,
        };
        sessionStorage.setItem("school", JSON.stringify(this.school));
      }

      sessionStorage.setItem("user", JSON.stringify(this.user));
    },

    updateSchool(school) {
      this.school = school || null;

      if (this.user && school?.name) {
        this.user = {
          ...this.user,
          school: school.name,
          subscription: school.subscription || this.user.subscription,
        };
        sessionStorage.setItem("user", JSON.stringify(this.user));
      }

      sessionStorage.setItem("school", JSON.stringify(this.school));
    },
  },
});
