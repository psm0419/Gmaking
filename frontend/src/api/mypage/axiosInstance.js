import axios from "axios";

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:8080";

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("gmaking_token");
  const auth = token
    ? (token.startsWith("Bearer ") ? token : `Bearer ${token}`)
    : null;

  // 디버그 로그
  console.log("📦 요청:", (config.method || "GET").toUpperCase(), config.baseURL + (config.url || ""), "| 토큰:", auth ? "있음" : "없음");

  // Authorization 헤더
  if (auth) {
    config.headers = config.headers || {};
    config.headers.Authorization = auth;
  }

  // FormData일 때는 Content-Type 제거 (브라우저가 자동 세팅)
  if (config.data instanceof FormData) {
    if (config.headers) {
      delete config.headers["Content-Type"];
      delete config.headers["content-type"];
    }
  }

  return config;
});

export default api;
