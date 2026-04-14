import API from "./api";

export const login = async (data) => {
  const res = await API.post("/auth/login", data);
  return res.data;
};

export const register = async (data) => {
  const res = await API.post("/auth/register", data);
  sessionStorage.setItem("token", res.data.token);
  return res.data;
};

export const forgotPassword = async (email, school) => {
  return API.post("/auth/forgot-password", { email, school });
};

export const resetPassword = async (data) => {
  const res = await API.post("/auth/reset-password", data);
  return res.data;
};
