import API from "./api";

export const getUsers = async () => {
  const res = await API.get("/users");
  return res.data;
};

export const getPayments = async () => {
  const res = await API.get("/payments");
  return res.data;
};