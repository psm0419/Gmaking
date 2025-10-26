import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/admin';

const getAuthHeaders = (token) => {
    if (!token) throw new Error("인증 토큰이 없습니다.");
    return { Authorization: `Bearer ${token}` };
};

/**
 * 1. 사용자 목록 조회
 * GET /api/admin/users
 */
export const fetchAllUsers = async (token) => {
    const response = await axios.get(`${API_BASE_URL}/users`, { headers: getAuthHeaders(token) });
    return response.data;
};

/**
 * 2. 사용자 삭제 (UI에 버튼이 있으므로 추가)
 * DELETE /api/admin/users/{userId}
 */
export const deleteUser = async (token, userId) => {
    const response = await axios.delete(`${API_BASE_URL}/users/${userId}`, { headers: getAuthHeaders(token) });
    return response.data;
};


/**
 * 3. 캐릭터 목록 조회
 * GET /api/admin/characters
 */
export const fetchAllCharacters = async (token) => {
    const response = await axios.get(`${API_BASE_URL}/characters`, { headers: getAuthHeaders(token) });
    return response.data;
};

/**
 * 4. 구매 내역 목록 조회
 * GET /api/admin/purchases
 */
export const fetchAllPurchases = async (token) => {
    const response = await axios.get(`${API_BASE_URL}/purchases`, { headers: getAuthHeaders(token) });
    return response.data;
};

/**
 * 5. 인벤토리 목록 조회
 * GET /api/admin/inventory
 */
export const fetchAllInventory = async (token) => {
    const response = await axios.get(`${API_BASE_URL}/inventory`, { headers: getAuthHeaders(token) });
    return response.data;
};

