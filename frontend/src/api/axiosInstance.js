import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api", // 또는 "/api"
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("gmaking_token");
   console.log("📦 보내는 요청:", config.url, "token:", token ? "있음" : "없음");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
