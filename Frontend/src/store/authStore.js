import { defineStore } from "pinia";
import { register } from "../services/authService";
import router from "../router";
import { connectSocket, disconnectSocket } from "../services/socket";
import API from "../services/api";

const LAST_SCHOOL_IDENTIFIER_KEY = "lastSchoolIdentifier";

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

const persistLastSchoolIdentifier = (value) => {
  try {
    const normalized = String(value || "").trim();

    if (normalized) {
      localStorage.setItem(LAST_SCHOOL_IDENTIFIER_KEY, normalized);
    }
  } catch {
    // Ignore storage errors.
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
        persistLastSchoolIdentifier(
          school?.code || user?.schoolCode || credentials?.school || school?.name
        );

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
      persistLastSchoolIdentifier(school?.code || school?.name);

      if (this.user && school?.name) {
        this.user = {
          ...this.user,
          school: school.name,
          schoolCode: school.code || this.user.schoolCode,
          subscription: school.subscription || this.user.subscription,
        };
        sessionStorage.setItem("user", JSON.stringify(this.user));
      }

      sessionStorage.setItem("school", JSON.stringify(this.school));
    },

    updateUserProfile(user) {
      if (!user) {
        return;
      }

      this.user = {
        ...this.user,
        ...user,
        school: user.school?.name || this.user?.school,
        schoolCode: user.school?.code || user.school?.schoolCode || this.user?.schoolCode,
      };

      if (user.school) {
        this.school = {
          ...this.school,
          ...user.school,
        };
        sessionStorage.setItem("school", JSON.stringify(this.school));
        persistLastSchoolIdentifier(
          user.school?.code || user.school?.schoolCode || user.school?.name
        );
      }

      sessionStorage.setItem("user", JSON.stringify(this.user));
    },
  },
});
