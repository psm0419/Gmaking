import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/notices';

/**
 * 1. 공지사항 목록 조회 (GET /api/notices)
 * @param {number} page - 요청할 페이지 번호 (1부터 시작)
 * @param {number} size - 페이지당 항목 수
 * @returns {Promise<object>} 공지사항 목록 및 페이징 정보
 */
export const getNotices = async (page = 1, size = 5) => {
    try {
        const response = await axios.get(`${API_BASE_URL}`, {
            params: {
                page: page,
                size: size
            }
        });
        return response.data;
    } catch (error) {
        console.error("API Error: 공지사항 목록 조회 실패", error);
        throw error;
    }
};

/**
 * 2. 공지사항 상세 조회 (GET /api/notices/{noticeId})
 * @param {number} noticeId - 공지 ID
 * @returns {Promise<object>} 공지사항 상세 데이터
 */
export const getNoticeDetail = async (noticeId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/${noticeId}`);
        return response.data;
    } catch (error) {
        console.error(`API Error: 공지사항 상세 (${noticeId}) 조회 실패`, error);
        throw error;
    }
};

/**
 * 3. 공지사항 등록 (POST /api/notices) - ADMIN 전용
 * @param {object} noticeData - { noticeTitle, noticeContent, isPinned }
 * @param {string} token - JWT 토큰
 * @returns {Promise<object>} 성공 응답
 */
export const createNotice = async (noticeData, token) => {
    try {
        const response = await axios.post(`${API_BASE_URL}`, noticeData, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data; 
    } catch (error) {
        console.error("API Error: 공지사항 등록 실패", error);
        throw error;
    }
};

/**
 * 4. 공지사항 수정 (PUT /api/notices/{noticeId}) - ADMIN 전용
 * @param {number} noticeId - 공지 ID
 * @param {object} noticeData - { noticeTitle, noticeContent, isPinned }
 * @param {string} token - JWT 토큰
 * @returns {Promise<object>} 성공 응답
 */
export const updateNotice = async (noticeId, noticeData, token) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/${noticeId}`, noticeData, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data; 
    } catch (error) {
        console.error(`API Error: 공지사항 (${noticeId}) 수정 실패`, error);
        throw error;
    }
};

/**
 * 5. 공지사항 삭제 (DELETE /api/notices/{noticeId}) - ADMIN 전용
 * @param {number} noticeId - 공지 ID
 * @param {string} token - JWT 토큰
 * @returns {Promise<object>} 성공 응답
 */
export const deleteNotice = async (noticeId, token) => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/${noticeId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error(`API Error: 공지사항 (${noticeId}) 삭제 실패`, error);
        throw error;
    }
};