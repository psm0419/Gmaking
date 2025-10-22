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

/**
 * 아이디 찾기 - 1단계: 이름과 이메일로 ID를 찾고 인증 코드 발송
 * POST /api/find-id/send-code
 */
export const findIdSendCodeApi = (userName, userEmail) => {
    return axios.post(`${API_BASE_URL}/find-id/send-code`, { userName, userEmail });
};

/**
 * 아이디 찾기 - 2단계: 인증 코드를 검증하고 마스킹된 아이디를 반환
 * POST /api/find-id/verify-code
 */
export const findIdVerifyCodeApi = (userId, email, code) => {
    // userId는 send-code 응답으로 받은 임시 ID입니다.
    return axios.post(`${API_BASE_URL}/find-id/verify-code`, { userId, email, code });
};


/**
 * 비밀번호 찾기 - 1단계: ID와 이메일로 사용자 검증 후 인증 코드 발송
 * POST /api/find-password/send-code
 */
export const findPasswordSendCodeApi = (userId, userEmail) => {
    return axios.post(`${API_BASE_URL}/find-password/send-code`, { userId, userEmail });
};

/**
 * 비밀번호 찾기 - 3단계: 인증 완료 후 새 비밀번호로 변경
 * POST /api/find-password/change
 * (2단계 인증은 기존 verifyEmailApi를 재활용)
 */
export const changePasswordApi = (userId, userEmail, newPassword, confirmPassword) => {
    return axios.post(`${API_BASE_URL}/find-password/change`, { userId, userEmail, newPassword, confirmPassword });
};


/**
 * 회원 탈퇴 API (DELETE /api/user/withdraw)
 * @param {string} token - JWT 토큰
 * @param {string} userId - 사용자 ID
 * @param {string} userPassword - 사용자가 입력한 비밀번호 (필수)
 */
export const withdrawUserApi = (token, userId, userPassword) => {
    return axios.delete(`${API_BASE_URL}/user/withdraw`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { userId, userPassword }
    });
};

/**
 * 소셜 회원 탈퇴 API (DELETE /api/user/withdraw/social)
 * 비밀번호 없이 JWT 인증만으로 탈퇴 처리
 * @param {string} token - JWT 토큰
 */
export const withdrawSocialUserApi = (token) => {
    // 백엔드에서 userId는 JWT 토큰에서 추출 
    return axios.delete(`${API_BASE_URL}/user/withdraw/social`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};