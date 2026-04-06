import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Attach token
API.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");

   console.log("TOKEN BEING SENT:", token);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 🔥 Handle errors globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log("401 ERROR:", error.response.data);
      // sessionStorage.clear();
      // window.location.href = "/"; // force logout
    }
    return Promise.reject(error);
  }
);

export default API;