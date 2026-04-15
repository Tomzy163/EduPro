import API from "./api";

export const getMySchool = async () => {
  const res = await API.get("/school");
  return res.data;
};

export const updateMySchool = async (data) => {
  const res = await API.put("/school", data);
  return res.data;
};
