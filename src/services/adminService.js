import API from "../api";

// 🔹 Get all user registrations
export const getAllRegistrations = async () => {
  const res = await API.get("/admin/registrations");
  return res.data;
};

export const approveUser = async (userId) => {
  const res = await API.post(`/admin/users/${userId}/approve`);
  return res.data;
};

export const rejectUser = async (userId) => {
  const res = await API.post(`/admin/users/${userId}/reject`);
  return res.data;
};

// 🔹 Get all booths (Admin)
export const getAllBoothsAdmin = async () => {
  const res = await API.get("/admin/booths");
  return res.data;
};

async function parseBlobError(err) {
  const data = err.response?.data;
  if (data instanceof Blob) {
    const text = await data.text();
    try {
      const j = JSON.parse(text);
      return j.error || text;
    } catch {
      return text || err.message;
    }
  }
  return err.response?.data?.error || err.message;
}

/**
 * Fetches a user's resume with the admin JWT (use blob; a plain URL cannot send Authorization).
 */
export const fetchUserResumeBlob = async (userId, disposition = "inline") => {
  const res = await API.get(`/admin/users/${userId}/resume`, {
    params: { disposition },
    responseType: "blob",
  });
  return {
    blob: res.data,
    contentType:
      res.headers["content-type"]?.split(";")[0]?.trim() ||
      "application/octet-stream",
  };
};

/** Opens the resume in a new tab (best for PDF). */
export const viewUserResume = async (userId) => {
  try {
    const { blob, contentType } = await fetchUserResumeBlob(userId, "inline");
    const url = URL.createObjectURL(
      blob instanceof Blob ? blob : new Blob([blob], { type: contentType })
    );
    const w = window.open(url, "_blank", "noopener,noreferrer");
    if (!w) {
      URL.revokeObjectURL(url);
      throw new Error("Popup blocked. Allow popups or use Download.");
    }
    setTimeout(() => URL.revokeObjectURL(url), 120_000);
  } catch (err) {
    const msg = await parseBlobError(err);
    throw new Error(msg);
  }
};

/** Triggers a file download in the browser. */
export const downloadUserResume = async (userId, filename) => {
  try {
    const { blob, contentType } = await fetchUserResumeBlob(userId, "attachment");
    const b = blob instanceof Blob ? blob : new Blob([blob], { type: contentType });
    const url = URL.createObjectURL(b);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "resume";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (err) {
    const msg = await parseBlobError(err);
    throw new Error(msg);
  }
};