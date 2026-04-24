import axios from "axios";
import { apiBaseUrl } from "./runtimeConfig";

const API = axios.create({
  baseURL: apiBaseUrl,
});

API.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  const rawSchool = sessionStorage.getItem("school");
  const rawUser = sessionStorage.getItem("user");

  let schoolId = "";

  try {
    const school = rawSchool ? JSON.parse(rawSchool) : null;
    const user = rawUser ? JSON.parse(rawUser) : null;
    schoolId = school?._id || user?.schoolId || "";
  } catch {
    schoolId = "";
  }

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
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("school");
      sessionStorage.removeItem("token");

      if (window.location.pathname !== "/") {
        window.location.assign("/");
      }
    }

    if (error.response?.status === 402 && error.response?.data?.code === "SUBSCRIPTION_REQUIRED") {
      try {
        const rawUser = sessionStorage.getItem("user");
        const rawSchool = sessionStorage.getItem("school");
        const user = rawUser ? JSON.parse(rawUser) : null;
        const school = rawSchool ? JSON.parse(rawSchool) : null;
        const subscription = error.response.data.subscription;

        if (user?.role === "admin") {
          sessionStorage.setItem(
            "user",
            JSON.stringify({
              ...user,
              subscription,
            })
          );

          if (school) {
            sessionStorage.setItem(
              "school",
              JSON.stringify({
                ...school,
                subscription,
              })
            );
          }

          if (window.location.pathname !== "/subscription") {
            window.location.assign("/subscription");
          }
        } else {
          sessionStorage.removeItem("user");
          sessionStorage.removeItem("school");
          sessionStorage.removeItem("token");

          if (window.location.pathname !== "/") {
            window.location.assign("/");
          }
        }
      } catch {
        // Ignore session parsing issues and surface the API error below.
      }
    }

    return Promise.reject(error);
  }
);

export default API;
