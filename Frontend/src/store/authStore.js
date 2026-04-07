// store/authStore.js
import { defineStore } from "pinia";
import { login, register } from "../services/authService";
import router from "../router"; // ✅ import router directly
import { connectSocket } from "../services/socket";
import API from "../services/api";

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
async loginUser(credentials) {
 
  try {
    console.log("Sending login request...");
    const res = await API.post("/auth/login", credentials);
    console.log("Response:", res);

    this.user = res.data.user;
    this.token = res.data.token;

    sessionStorage.setItem("token", res.data.token);
    sessionStorage.setItem("user", JSON.stringify(res.data.user));

    connectSocket(res.data.user.id);

    return res.data;
  } catch (err) {
    console.log("LOGIN ERROR:", err.response);
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

// sessionStorage.clear();

// connectSocket(user.id);

// switch (user.role) {
//   case "admin":
//     router.push("/dashboard/admin");
//     break;
//   case "teacher":
//     router.push("/dashboard/teacher");
//     break;
//   case "student":
//     router.push("/dashboard/student");
//     break;
//   case "parent":
//     router.push("/dashboard/parent");
//     break;
// }