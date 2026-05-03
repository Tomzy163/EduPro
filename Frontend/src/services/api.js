import axios from "axios";
import { apiBaseUrl } from "./runtimeConfig";
import {
  clearStoredSession,
  getStoredSchool,
  getStoredUser,
  syncStoredSubscription,
} from "../utils/session";

const API = axios.create({
  baseURL: apiBaseUrl,
});

API.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  let schoolId = "";
  const school = getStoredSchool();
  const user = getStoredUser();
  schoolId = school?._id || user?.schoolId || "";

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (schoolId) {
    config.headers["x-school-id"] = schoolId;
  }

  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearStoredSession();

      if (window.location.pathname !== "/") {
        window.location.assign("/");
      }
    }

    const responseCode = error.response?.data?.code;
    const subscription = error.response?.data?.subscription;
    const user = getStoredUser();

    if (subscription) {
      syncStoredSubscription(subscription);
    }

    if (error.response?.status === 402 && responseCode === "SUBSCRIPTION_REQUIRED") {
      if (user?.role === "admin" && window.location.pathname !== "/subscription") {
        window.location.assign("/subscription");
      }
    }

    return Promise.reject(error);
  }
);

export default API;
