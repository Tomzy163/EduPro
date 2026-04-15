import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

API.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
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
        }
      } catch {
        // Ignore session parsing issues and surface the API error below.
      }
    }

    return Promise.reject(error);
  }
);

export default API;
