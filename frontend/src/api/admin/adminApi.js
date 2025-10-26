import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/admin';

const getAuthHeaders = (token) => {
    if (!token) throw new Error("인증 토큰이 없습니다.");
    return { Authorization: `Bearer ${token}` };
};

const buildQueryString = (params) => {
    const query = new URLSearchParams();
    for (const key in params) {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
            query.append(key, params[key]);
        }
    }
    return query.toString();
};

/**
 * 1. 사용자 목록 조회 (페이징/검색 적용)
 * GET /api/admin/users
 */
export const fetchAllUsers = async (token, params = {}) => {
    const queryString = buildQueryString(params);
    const response = await axios.get(`${API_BASE_URL}/users?${queryString}`, { headers: getAuthHeaders(token) });
    return response.data; 
};

/**
 * 2. 사용자 삭제 (유지)
 * DELETE /api/admin/users/{userId}
 */
export const deleteUser = async (token, userId) => {
    const response = await axios.delete(`${API_BASE_URL}/users/${userId}`, { headers: getAuthHeaders(token) });
    return response.data;
};


/**
 * 3. 캐릭터 목록 조회 (페이징/검색 적용)
 * GET /api/admin/characters
 */
export const fetchAllCharacters = async (token, params = {}) => {
    const queryString = buildQueryString(params);
    const response = await axios.get(`${API_BASE_URL}/characters?${queryString}`, { headers: getAuthHeaders(token) });
    return response.data;
};

/**
 * 4. 구매 내역 목록 조회 (페이징/검색 적용)
 * GET /api/admin/purchases
 */
export const fetchAllPurchases = async (token, params = {}) => {
    const queryString = buildQueryString(params);
    const response = await axios.get(`${API_BASE_URL}/purchases?${queryString}`, { headers: getAuthHeaders(token) });
    return response.data;
};

/**
 * 5. 인벤토리 목록 조회 (페이징/검색 적용)
 * GET /api/admin/inventory
 */
export const fetchAllInventory = async (token, params = {}) => {
    const queryString = buildQueryString(params);
    const response = await axios.get(`${API_BASE_URL}/inventory?${queryString}`, { headers: getAuthHeaders(token) });
    return response.data;
};