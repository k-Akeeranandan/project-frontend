import API from "../api";

export const getChatContacts = async () => {
  const res = await API.get("/chat/contacts");
  return res.data;
};

export const getGlobalMessages = async () => {
  const res = await API.get("/chat/global");
  return res.data;
};

export const sendGlobalMessage = async (content) => {
  const res = await API.post("/chat/global", { content });
  return res.data;
};

export const getPrivateMessages = async (otherUserId) => {
  const res = await API.get(`/chat/private/${otherUserId}`);
  return res.data;
};

export const sendPrivateMessage = async (recipientId, content) => {
  const res = await API.post("/chat/private", { recipientId, content });
  return res.data;
};
