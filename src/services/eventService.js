import API from "../api";

// 🔹 Get all events
export const getEvents = async () => {
  const res = await API.get("/user/events");
  return res.data;
};

// 🔹 Create new event (Admin)
export const createEvent = async (data) => {
  const res = await API.post("/admin/event", data);
  return res.data;
};

// 🔹 Get single event (optional - future use)
export const getEventById = async (id) => {
  const res = await API.get(`/user/events/${id}`);
  return res.data;
};

// 🔹 Delete event (Admin)
export const deleteEvent = async (id) => {
  const res = await API.delete(`/admin/event/${id}`);
  return res.data;
};

// 🔹 Get all events (Admin)
export const getAllEventsAdmin = async () => {
  const res = await API.get("/admin/events");
  return res.data;
};