import API from "./api";

export const getTeacherResults = async () => {
  const res = await API.get("/results/teacher");
  return res.data;
};

export const getStudentResults = async (id) => {
  const res = await API.get(`/results/student/${id}`);
  return res.data;
};

export const uploadResult = async (data) => {
  const res = await API.post("/results", data);
  return res.data;
};

export const updateResult = async (id, data) => {
  const res = await API.put(`/results/${id}`, data);
  return res.data;
};

export const deleteResult = async (id) => {
  const res = await API.delete(`/results/${id}`);
  return res.data;
};
