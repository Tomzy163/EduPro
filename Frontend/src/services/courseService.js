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

export const getAssignmentHistory = async () => {
  const res = await API.get("/courses/assignments/history");
  return res.data;
};

export const updateStudentAssignment = async (studentId, courseId, data) => {
  const res = await API.put(`/courses/assignments/student/${studentId}/${courseId}`, data);
  return res.data;
};

export const deleteStudentAssignment = async (studentId, courseId) => {
  const res = await API.delete(`/courses/assignments/student/${studentId}/${courseId}`);
  return res.data;
};

export const clearStudentAssignments = async () => {
  const res = await API.delete("/courses/assignments/student");
  return res.data;
};

export const updateTeacherAssignment = async (courseId, data) => {
  const res = await API.put(`/courses/assignments/teacher/${courseId}`, data);
  return res.data;
};

export const deleteTeacherAssignment = async (courseId) => {
  const res = await API.delete(`/courses/assignments/teacher/${courseId}`);
  return res.data;
};

export const clearTeacherAssignments = async () => {
  const res = await API.delete("/courses/assignments/teacher");
  return res.data;
};
