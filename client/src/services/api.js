import axios from "axios";

// Use the Render URL in production, otherwise use localhost for dev
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const API = axios.create({
  baseURL,
  withCredentials: true,    // Sends cookies automatically
});

export default API;