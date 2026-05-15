import api from "./api.js";

// Stats
export const getAdminStats = () => api.get("/admin/stats");

// Users
export const getAllUsers = (params) => api.get("/admin/users", { params });
export const getUserById = (id) => api.get(`/admin/users/${id}`);
export const updateUserRole = (id, role) =>
  api.put(`/admin/users/${id}/role`, { role });
export const toggleUserActive = (id) => api.put(`/admin/users/${id}/toggle`);
export const deleteUser = (id) => api.delete(`/admin/users/${id}`);

// Properties
export const getAllProperties = (params) =>
  api.get("/admin/properties", { params });
export const deleteProperty = (id) => api.delete(`/admin/properties/${id}`);
export const toggleProperty = (id) => api.put(`/admin/properties/${id}/toggle`);

// Bookings
export const getAllBookings = (params) =>
  api.get("/admin/bookings", { params });
export const adminCancelBooking = (id) =>
  api.put(`/admin/bookings/${id}/cancel`);
