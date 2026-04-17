const defaultApiBaseUrl = "http://localhost:5000/api";

export const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl
).replace(/\/+$/, "");

export const socketBaseUrl = (
  import.meta.env.VITE_SOCKET_URL || apiBaseUrl.replace(/\/api$/, "")
).replace(/\/+$/, "");
