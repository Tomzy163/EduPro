import API from "./api";

export const createPayment = async (formData) => {
  const res = await API.post("/payments", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const getPayments = async () => {
  const res = await API.get("/payments");
  return res.data;
};