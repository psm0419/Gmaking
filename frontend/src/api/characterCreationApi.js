const API_BASE_URL = 'http://localhost:8080';

/**
 * 캐릭터 생성 API 호출 함수
 * @param {File} imageFile 업로드된 이미지 파일
 * @param {string} characterName 캐릭터 이름
 * @param {string} token JWT 토큰
 * @returns {Promise<object>} API 응답 JSON
 */
export async function createCharacter(imageFile, characterName, token) {
    if (!imageFile || !characterName.trim()) {
        throw new Error('이미지와 캐릭터 이름이 필요합니다.');
    }

    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('characterName', characterName);

    const response = await fetch(`${API_BASE_URL}/api/character/create`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '알 수 없는 서버 오류' }));
        throw new Error(`캐릭터 생성 실패: ${errorData.message || response.statusText}`);
    }

    return await response.json();
}
