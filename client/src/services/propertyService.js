import API from "./api";

export const getAllProperties = (params) =>
  API.get("/properties", { params });

export const getPropertyById = (id) =>
  API.get(`/properties/${id}`);

export const getMyListings = () =>
  API.get("/properties/my-listings");

export const createProperty = (data) =>
  API.post("/properties", data); // data is FormData for images

export const updateProperty = (id, data) =>
  API.put(`/properties/${id}`, data);


export const deleteProperty = (id) =>
  API.delete(`/properties/${id}`);