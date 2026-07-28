import axios from "axios";

const resolveBaseURL = () => {
  const url = import.meta.env.VITE_API_URL || "https://alertocalbayog.onrender.com";
  return `${url.replace(/\/+$/, "")}/api`;
};

const api = axios.create({
  baseURL: resolveBaseURL(),
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
