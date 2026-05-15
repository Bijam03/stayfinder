import axios from "axios";

// All API calls go to our backend
const API = axios.create({
  baseURL: "/api",          // Uses Vite proxy → localhost:5000/api
  withCredentials: true,    // Sends cookies automatically
});

export default API;