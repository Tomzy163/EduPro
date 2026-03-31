import API from "./api";

export const uploadResult = async (data) => {
  const res = await API.post("/results", data);
  return res.data;
};

export const getStudentResults = async (studentId) => {
  const res = await API.get(`/results/student/${studentId}`);
  return res.data;
};