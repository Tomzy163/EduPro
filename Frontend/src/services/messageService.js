import API from "./api";

export const sendMessage = async (data) => {
  const res = await API.post("/messages", data);
  return res.data;
};

export const getMessages = async () => {
  const res = await API.get("/messages");
  return res.data;
};