import axios from "axios";

// Create an Axios instance
const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Add request interceptor for auth token
API.interceptors.request.use((req) => {
  const user = JSON.parse(sessionStorage.getItem("user")); // ✅

  if (user?.token) {
    req.headers.Authorization = `Bearer ${user.token}`;
  }

  return req;
});

export default API; // ✅ only export once