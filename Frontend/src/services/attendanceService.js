import API from "./api";

export const markAttendance = async (data) => {
  const res = await API.post("/attendance", data);
  return res.data;
};

export const getAttendance = async (studentId) => {
  const res = await API.get(`/attendance/student/${studentId}`);
  return res.data;
};