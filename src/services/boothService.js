import API from "../api";

// 🔹 Get all booths
export const getBooths = async () => {
  const res = await API.get("/user/booths");
  return res.data;
};

// 🔹 Apply to a booth
export const applyToBooth = async (boothId) => {
  const res = await API.post(`/user/apply/${boothId}`);
  return res.data;
};

export const submitBoothApplication = async (boothId, data) => {
  const res = await API.post(`/user/applications/${boothId}`, data);
  return res.data;
};

export const getMyBoothApplication = async (boothId) => {
  const res = await API.get(`/user/applications/${boothId}`);
  return res.data;
};

// 🔹 Get user's applications
export const getMyApplications = async () => {
  const res = await API.get("/user/my-applications");
  return res.data;
};

// 🔹 Create booth (Admin)
export const createBooth = async (data) => {
  const res = await API.post("/admin/booth", data);
  return res.data;
};

// 🔹 Get booth applicants (Admin)
export const getBoothApplicants = async (boothId) => {
  const res = await API.get(`/admin/booth/${boothId}/applicants`);
  return res.data;
};

// 🔹 Delete booth (Admin)
export const deleteBooth = async (boothId) => {
  const res = await API.delete(`/admin/booth/${boothId}`);
  return res.data;
};