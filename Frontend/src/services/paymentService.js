import API from "./api";

export const createPayment = async (formData) => {
  const res = await API.post("/payments", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

export const getPayments = async () => {
  const res = await API.get("/payments");
  return res.data;
};

export const getMyPayments = async () => {
  const res = await API.get("/payments/mine");
  return res.data;
};

export const deletePayment = async (id) => {
  const res = await API.delete(`/payments/${id}`);
  return res.data;
};

export const clearPayments = async () => {
  const res = await API.delete("/payments");
  return res.data;
};
