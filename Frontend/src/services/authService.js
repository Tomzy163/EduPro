import API from "./api";

// LOGIN
export const login = async (data) => {
  try {
    const res = await API.post("/auth/login", data);
    return res.data;
  } catch (error) {
    console.error("Login error:", error.response?.data || error.message);
    throw error;
  }
};

// REGISTER
export const register = async (data) => {
  try {
    const res = await API.post("/auth/register", data);
    return res.data;
  } catch (error) {
    console.error("Register error:", error.response?.data || error.message);
    throw error; // 🔥 IMPORTANT so frontend catches it
  }
};

// FORGOT PASSWORD
export const forgotPassword = async (email) => {
  try {
    const res = await API.post("/auth/forgot-password", { email });
    return res.data;
  } catch (error) {
    console.error("Forgot password error:", error.response?.data);
    throw error;
  }
};

// RESET PASSWORD
export const resetPassword = async (data) => {
  try {
    const res = await API.post("/auth/reset-password", data);
    return res.data;
  } catch (error) {
    console.error("Reset password error:", error.response?.data);
    throw error;
  }
};