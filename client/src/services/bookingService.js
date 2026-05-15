import API from "./api";

export const createBooking = (data) =>
  API.post("/bookings", data);

export const getMyBookings = () =>
  API.get("/bookings/my-bookings");

export const getHostBookings = () =>
  API.get("/bookings/host-bookings");

export const getBookingById = (id) =>
  API.get(`/bookings/${id}`);

export const cancelBooking = (id, reason) =>
  API.put(`/bookings/${id}/cancel`, { reason });

export const confirmBooking = (id) =>
  API.put(`/bookings/${id}/confirm`);

export const getBookedDates = (propertyId) =>
  API.get(`/bookings/${propertyId}/booked-dates`);