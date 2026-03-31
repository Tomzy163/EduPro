import API from "./api";

export const getUsers = async () => {
  const res = await API.get("/users");
  return res.data;
};

export const createUser = async (data) => {
  const res = await API.post("/users", data);
  return res.data;
};

export const deleteUser = async (id) => {
  const res = await API.delete(`/users/${id}`);
  return res.data;
};