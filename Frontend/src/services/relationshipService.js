import API from "./api";

export const linkParent = (data) =>
  API.post("/relationships/link", data);

export const getHistory = () =>
  API.get("/relationships/history");

export const deleteLink = (id) =>
  API.delete(`/relationships/${id}`);

export const deleteAllLinks = () =>
  API.delete("/relationships");