import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

// 로그인 API
export const loginApi = (userId, userPassword) => {
  return axios.post(`${API_BASE_URL}/login`, { userId, userPassword });
};

export const securedTestApi = (token) => {
  return axios.get(`${API_BASE_URL}/secured/test`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

// 회원가입 API (POST /api/register)
export const registerApi = (userData) => {
  // 백엔드 RegisterRequestVO에 맞게 모든 데이터를 그대로 전송
  return axios.post(`${API_BASE_URL}/register`, userData); 
};

// 이메일 인증 코드 확인 API (POST /api/email/verify-code)
export const verifyEmailApi = (userId, email, code) => {
  return axios.post(`${API_BASE_URL}/email/verify-code`, { userId, email, code });
};