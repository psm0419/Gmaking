// src/api/myPageApi.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

// 토큰 가져오는 헬퍼 함수
const getToken = () => localStorage.getItem("gmaking_token");

// 공통 헤더 세팅 함수
const authHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};


// 마이페이지 프로필 조회
export const getMyPageProfile = (userId) => {
  return axios.get(`${API_BASE_URL}/my-page/profile`, {
    params: { userId },
    headers: authHeaders(),
  });
};


// 캐릭터 목록 조회
export const getMyPageCharacters = (userId, page = 0, size = 12) => {
  return axios.get(`${API_BASE_URL}/my-page/characters`, {
    params: { userId, page, size },
    headers: authHeaders(), // 👈 토큰 추가
  });
};


// 마이페이지 요약 (프로필 + 캐릭터 미리보기)
export const getMyPageSummary = (userId, previewSize = 6) => {
  return axios.get(`${API_BASE_URL}/my-page/summary`, {
    params: { userId, previewSize },
    headers: authHeaders(), // 👈 토큰 추가
  });
};
