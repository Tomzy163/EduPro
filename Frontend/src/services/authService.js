import API from "./api";

// LOGIN
export const login = async (data) => {
  const res = await API.post("/auth/login", data);
  return res.data;
};

// REGISTER
export const register = async (data) => {
  const res = await API.post("/auth/register", data);
  return res.data;
};

// FORGOT PASSWORD
export const forgotPassword = async (email, school) => {
  return API.post("/auth/forgot-password", { email, school });
};
// RESET PASSWORD
export const resetPassword = async (data) => {
  const res = await API.post("/auth/reset-password", data);
  return res.data;
};