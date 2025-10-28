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
 * 사용자 목록 조회 (페이징/검색 적용)
 * GET /api/admin/users
 */
export const fetchAllUsers = async (token, params = {}) => {
    const queryString = buildQueryString(params);
    const response = await axios.get(`${API_BASE_URL}/users?${queryString}`, { headers: getAuthHeaders(token) });
    return response.data; 
};

/**
 * 사용자 삭제
 * DELETE /api/admin/users/{userId}
 */
export const deleteUser = async (token, userId) => {
    const response = await axios.delete(`${API_BASE_URL}/users/${userId}`, { headers: getAuthHeaders(token) });
    return response.data;
};


/**
 * 캐릭터 목록 조회 (페이징/검색 적용)
 * GET /api/admin/characters
 */
export const fetchAllCharacters = async (token, params = {}) => {
    const queryString = buildQueryString(params);
    const response = await axios.get(`${API_BASE_URL}/characters?${queryString}`, { headers: getAuthHeaders(token) });
    return response.data;
};

/**
 * 캐릭터 삭제
 * DELETE /api/admin/characters/{characterId}
 * @param {string} token 사용자 인증 토큰
 * @param {number} characterId 삭제할 캐릭터 ID
 */
export const deleteCharacter = async (token, characterId) => {
    const response = await axios.delete(`${API_BASE_URL}/characters/${characterId}`, { headers: getAuthHeaders(token) });
    return response.data;
};

/**
 * 구매 내역 목록 조회 (페이징/검색 적용)
 * GET /api/admin/purchases
 */
export const fetchAllPurchases = async (token, params = {}) => {
    const queryString = buildQueryString(params);
    const response = await axios.get(`${API_BASE_URL}/purchases?${queryString}`, { headers: getAuthHeaders(token) });
    return response.data;
};

/**
 * 인벤토리 목록 조회 (페이징/검색 적용)
 * GET /api/admin/inventory
 */
export const fetchAllInventory = async (token, params = {}) => {
    const queryString = buildQueryString(params);
    const response = await axios.get(`${API_BASE_URL}/inventory?${queryString}`, { headers: getAuthHeaders(token) });
    return response.data;
};

/**
 * 특정 사용자에게 아이템 지급 (부화권 등)
 * POST /api/admin/inventory/give-item
 * @param {string} token 사용자 인증 토큰
 * @param {object} data 지급할 아이템 정보 ({ userId, productId, quantity })
 * @returns {Promise<object>} 응답 데이터
 */
export const giveItemToUser = async (token, data) => {
    const response = await axios.post(`${API_BASE_URL}/inventory/give-item`, data, { 
        headers: getAuthHeaders(token) 
    });
    return response.data;
};

/**
 * 상품 목록 조회 (페이징/검색/필터 적용)
 * GET /api/admin/products
 */
export const fetchAllProducts = async (token, params = {}) => {
    const queryString = buildQueryString(params);
    const response = await axios.get(`${API_BASE_URL}/products?${queryString}`, { 
        headers: getAuthHeaders(token) 
    });
    return response.data;
};

/**
 * 상품 추가
 * POST /api/admin/products
 * @param {string} token 사용자 인증 토큰
 * @param {object} productData 등록할 상품 데이터 객체
 * @returns {Promise<object>} 응답 데이터
 */
export const createProduct = async (token, productData) => {
    const response = await axios.post(`${API_BASE_URL}/products`, productData, { 
        headers: getAuthHeaders(token) 
    });
    return response.data;
};

/**
 * 상품 정보 수정
 * PUT /api/admin/products/{productId}
 */
export const updateProduct = async (token, productId, productData) => {
    const response = await axios.put(`${API_BASE_URL}/products/${productId}`, productData, { 
        headers: getAuthHeaders(token) 
    });
    return response.data;
};

/**
 * 상품 삭제
 * DELETE /api/admin/products/{productId}
 */
export const deleteProduct = async (token, productId) => {
    const response = await axios.delete(`${API_BASE_URL}/products/${productId}`, { 
        headers: getAuthHeaders(token) 
    });
    return response.data;
};

/**
 * 게시글 목록 조회 (페이징/검색/필터 적용)
 * GET /api/admin/posts
 * @param {string} token 사용자 인증 토큰
 * @param {object} params 검색 조건 객체 ({ page, pageSize, searchKeyword, filterCategory, filterIsDeleted })
 * @returns {Promise<object>} 게시글 목록 데이터 및 페이징 정보
 */
export const fetchAllPosts = async (token, params = {}) => {
    const queryString = buildQueryString(params);
    const response = await axios.get(`${API_BASE_URL}/posts?${queryString}`, { 
        headers: getAuthHeaders(token) 
    });
    return response.data;
};

/**
 * 게시글 삭제 (Soft Delete: IS_DELETED='Y'로 변경)
 * DELETE /api/admin/posts/{postId}
 * @param {string} token 사용자 인증 토큰
 * @param {bigint} postId 삭제할 게시글 ID
 * @returns {Promise<void>} 
 */
export const deletePost = async (token, postId) => {
    const response = await axios.delete(`${API_BASE_URL}/posts/${postId}`, { 
        headers: getAuthHeaders(token) 
    });
    return response.data;
};

/**
 * 신고 목록 조회 (페이징/검색/필터 적용)
 * GET /api/admin/reports
 * @param {string} token 사용자 인증 토큰
 * @param {object} params 검색 조건 객체 ({ page, pageSize, searchKeyword, filterStatus, filterType })
 * @returns {Promise<object>} 신고 목록 데이터 및 페이징 정보
 */
export const fetchAllReports = async (token, params = {}) => {
    const queryString = buildQueryString(params);
    const response = await axios.get(`${API_BASE_URL}/reports?${queryString}`, { 
        headers: getAuthHeaders(token) 
    });
    return response.data;
};

/**
 * 신고 처리 (상태 변경 및 조치)
 * PUT /api/admin/reports/{reportId}/status
 * @param {string} token 사용자 인증 토큰
 * @param {number} reportId 처리할 신고 ID
 * @param {string} status 변경할 상태 (REJECTED, APPROVED, REVIEWED)
 */
export const processReport = async (token, reportId, status) => {
    const data = { status };
    const response = await axios.put(`${API_BASE_URL}/reports/${reportId}/status`, data, { headers: getAuthHeaders(token) });
    return response.data;
};

/**
 * 몬스터 목록 조회 (페이징/검색/유형 필터링 적용)
 * GET /api/admin/monsters
 * @param {string} token 사용자 인증 토큰
 * @param {object} params 검색 및 페이징 파라미터
 * @returns {Promise<object>} 몬스터 목록 데이터
 */
export const fetchAllMonsters = async (token, params = {}) => {
    const queryString = buildQueryString(params);
    const response = await axios.get(`${API_BASE_URL}/monsters?${queryString}`, { headers: getAuthHeaders(token) });
    return response.data; 
};


/**
 * 몬스터 등록 (이미지 파일 포함)
 * POST /api/admin/monsters (multipart/form-data)
 * @param {string} token 사용자 인증 토큰
 * @param {FormData} formData 몬스터 데이터(monsterData) 및 이미지 파일(imageFile)
 * @returns {Promise<void>} 
 */
export const createMonster = async (token, formData) => {
    const response = await axios.post(`${API_BASE_URL}/monsters`, formData, { 
        headers: getAuthHeaders(token),
        'Content-Type': 'multipart/form-data' 
    });
    return response.data;
};

/**
 * 몬스터 상세 조회
 * GET /api/admin/monsters/{monsterId}
 * @param {string} token 사용자 인증 토큰
 * @param {number} monsterId 조회할 몬스터 ID
 * @returns {Promise<object>} 몬스터 데이터
 */
export const fetchMonsterById = async (token, monsterId) => {
    const response = await axios.get(`${API_BASE_URL}/monsters/${monsterId}`, { 
        headers: getAuthHeaders(token) 
    });
    return response.data;
};


/**
 * 몬스터 수정 (이미지 파일 포함)
 * PUT /api/admin/monsters/{monsterId}
 * @param {string} token 사용자 인증 토큰
 * @param {number} monsterId 수정할 몬스터 ID
 * @param {FormData} formData 몬스터 데이터(monsterData) 및 새 이미지 파일(newImageFile)
 * @returns {Promise<void>} 
 */
export const updateMonster = async (token, monsterId, formData) => {
    const response = await axios.put(`${API_BASE_URL}/monsters/${monsterId}`, formData, { 
        headers: getAuthHeaders(token),
        'Content-Type': 'multipart/form-data'
    });
    return response.data;
};


/**
 * 몬스터 삭제
 * DELETE /api/admin/monsters/{monsterId}
 * @param {string} token 사용자 인증 토큰
 * @param {number} monsterId 삭제할 몬스터 ID
 * @returns {Promise<void>}
 */
export const deleteMonster = async (token, monsterId) => {
    const response = await axios.delete(`${API_BASE_URL}/monsters/${monsterId}`, { 
        headers: getAuthHeaders(token) 
    });
    return response.data;
};