import API from "./api";

export const getAiUsageSummary = async () => {
  const response = await API.get("/ai/usage-summary");
  return response.data;
};

export const getTutorHistory = async () => {
  const response = await API.get("/ai/chat/history");
  return response.data;
};

export const chatWithTutor = async (payload) => {
  const response = await API.post("/ai/chat", payload);
  return response.data;
};

export const generateExam = async (payload) => {
  const response = await API.post("/ai/generate-exam", payload);
  return response.data;
};

export const generateReportComment = async (payload) => {
  const response = await API.post("/ai/report-comment", payload);
  return response.data;
};

export const getAdminInsights = async (payload) => {
  const response = await API.post("/ai/admin-insights", payload);
  return response.data;
};

export const askParentAssistant = async (payload) => {
  const response = await API.post("/ai/parent-assistant", payload);
  return response.data;
};
