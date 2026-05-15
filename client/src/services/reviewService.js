import API from "./api";

export const getPropertyReviews = (propertyId) =>
  API.get(`/reviews/${propertyId}`);

export const canReviewProperty = (propertyId) =>
  API.get(`/reviews/${propertyId}/can-review`);

export const createReview = (data) =>
  API.post("/reviews", data);

export const updateReview = (id, data) =>
  API.put(`/reviews/${id}`, data);

export const deleteReview = (id) =>
  API.delete(`/reviews/${id}`);