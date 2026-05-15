import API from "./api";

export const registerUser = (data) => API.post("/auth/register", data);
export const loginUser = (data) => API.post("/auth/login", data);
export const logoutUser = () => API.post("/auth/logout");
export const getMe = () => API.get("/auth/me");
export const updateProfile = (data) => API.put("/auth/update-profile", data);
export const updateAvatar = (data) =>
  API.put("/auth/update-avatar", data); 
export const forgotPassword = (data) =>
  API.post("/auth/forgot-password", data);
export const resetPassword = (data) =>
  API.put("/auth/reset-password", data);