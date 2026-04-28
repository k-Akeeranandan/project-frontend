import API from "../api";

export const getCurrentUserProfile = async () => {
  const res = await API.get("/user/me");
  return res.data;
};

/** Uploads a resume (PDF or Word). Requires Authorization header (via api.js). */
export const uploadResume = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await API.post("/user/resume", formData);
  return res.data;
};
