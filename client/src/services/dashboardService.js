import API from "./api";

export const getHostDashboard = () => API.get("/dashboard/host");