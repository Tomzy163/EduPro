import API from "./api";

export const getCourses = async () => {
  const res = await API.get("/courses");
  return res.data;
};

export const createCourse = async (data) => {
  const res = await API.post("/courses", data);
  return res.data;
};

export const assignTeacher = async (data) => {
  const res = await API.post("/courses/assign-teacher", data);
  return res.data;
};

export const assignStudent = async (data) => {
  const res = await API.post("/courses/assign-student", data);
  return res.data;
};