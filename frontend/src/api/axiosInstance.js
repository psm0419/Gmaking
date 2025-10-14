import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api", // 또는 "/api"
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("gmaking_token");
  const hasBearer = token && token.startsWith("Bearer ");
  const auth = hasBearer ? token : (token ? `Bearer ${token}` : null);

   console.log("📦 요청:", config.method?.toUpperCase(), config.url, "| token:", auth ? "있음" : "없음");

  if (auth) {
      // 헤더 객체 보장
      config.headers = config.headers || {};
      config.headers.Authorization = auth;
    }
  return config;
});

export default api;
