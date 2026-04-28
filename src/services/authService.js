import API from "../api";

export const registerUser = async (data) => {
  return await API.post("/auth/register", data);
};

export const loginUser = async (email, password) => {
  const res = await API.post("/auth/login", { email, password });

  if (res.data?.token) {
    localStorage.setItem("token", res.data.token);
  }

  if (res.data?.user) {
    localStorage.setItem("user", JSON.stringify(res.data.user));
  } else {
    localStorage.removeItem("user");
  }

  return res.data;
};

export const sendForgotPasswordOtp = async (email) => {
  const res = await API.post("/auth/forgot-password/send-otp", { email });
  return res.data;
};

export const verifyForgotPasswordOtp = async (email, otp) => {
  const res = await API.post("/auth/forgot-password/verify-otp", { email, otp });
  return res.data;
};

export const resetForgotPassword = async (email, otp, newPassword) => {
  const res = await API.post("/auth/forgot-password/reset", { email, otp, newPassword });
  return res.data;
};