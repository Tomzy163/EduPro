import API from "./api";

export const login = async (data) => {
  const res = await API.post("/auth/login", data);
  return res.data;
};

export const register = async (data) => {
  const res = await API.post("/auth/register", data);
  return res.data;
};

export const forgotPassword = async (data) => {
  const res = await API.post("/auth/forgot-password", data);
  return res.data;
};

export const resetPassword = async (data) => {
  const res = await API.post("/auth/reset-password", data);
  return res.data;
};

export const getSubscriptionStatus = async () => {
  const res = await API.get("/auth/subscription-status");
  return res.data;
};

export const subscribeSchool = async (payload) => {
  const res = await API.post("/auth/subscribe", payload);
  return res.data;
};

export const verifySubscriptionPayment = async (reference) => {
  const res = await API.get("/auth/subscribe/verify", {
    params: { reference },
  });
  return res.data;
};
