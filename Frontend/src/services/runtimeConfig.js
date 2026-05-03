const trimTrailingSlash = (value = "") => String(value || "").replace(/\/+$/, "");
const browserOrigin =
  typeof window !== "undefined" ? trimTrailingSlash(window.location.origin) : "";
const defaultApiBaseUrl = import.meta.env.DEV
  ? "http://localhost:5000/api"
  : `${browserOrigin}/api`;

export const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl
).replace(/\/+$/, "");

export const socketBaseUrl = (
  import.meta.env.VITE_SOCKET_URL || apiBaseUrl.replace(/\/api$/, "")
).replace(/\/+$/, "");
