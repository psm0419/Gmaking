import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080';

/**
 * 캐릭터 생성 시작 시 부화권을 차감하고 새 토큰을 반환합니다.
 * @param {string} token 현재 JWT 토큰
 * @returns {Promise<object>} 응답 데이터 (성공 시 { newToken: '...' }, 실패 시 { errorMessage: '...' })
 */
export const startCharacterGeneration = async (token) => {
    try {
        const response = await axios.post(
            '/api/character/start-generation',
            {}, 
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        return response.data;
    } catch (error) {
        // 400 Bad Request (부화권 부족) 에러 처리
        if (error.response && error.response.data && error.response.data.errorMessage) {
            return error.response.data; 
        }
        console.error('캐릭터 생성 시작 API 호출 오류:', error);
        return { errorMessage: '캐릭터 생성 시작 중 서버 오류가 발생했습니다.' };
    }
};

/**
 * 캐릭터 미리보기 생성 API 호출 함수 (DB 저장 X)
 * @param {File} imageFile 업로드된 이미지 파일
 * @param {string} characterName 캐릭터 이름
 * @param {string} token JWT 토큰
 * @param {string} userPrompt 사용자 입력 추가 프롬프트 (선택 사항)
 * @returns {Promise<object>} CharacterGenerateResponseVO {imageUrl, predictedAnimal}
 */
export async function generateCharacterPreview(imageFile, characterName, token, userPrompt = '') {
    if (!imageFile || !characterName.trim()) {
        throw new Error('이미지와 캐릭터 이름이 필요합니다.');
    }

    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('characterName', characterName);

    // 유저 프롬프트가 있을 때
    if (userPrompt && userPrompt.trim() !== '') {
        formData.append('userPrompt', userPrompt);
    }

    const response = await fetch(`${API_BASE_URL}/api/character/generate`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body: formData,
    });

    const responseText = await response.text();

    let responseData;
    try {
        responseData = JSON.parse(responseText);
    } catch {
        responseData = { message: responseText };
    }

    if (!response.ok) {
        const errorMessage =
            responseData.message?.trim() ||
            responseData.error?.trim() ||
            `HTTP ${response.status}: ${response.statusText}`;

        throw new Error(errorMessage);
    }

    return responseData;
}

/**
 * 캐릭터 최종 확정 API 호출 함수 (DB 저장 및 토큰 갱신)
 * @param {object} characterData 생성된 캐릭터 정보 (characterName, imageUrl, predictedAnimal 포함)
 * @param {string} token JWT 토큰
 * @returns {Promise<object>} API 응답 JSON
 */
export async function finalizeCharacter(characterData, token) { 
    const response = await fetch(`${API_BASE_URL}/api/character/finalize`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(characterData),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`캐릭터 최종 확정 실패 (${response.status}): ${errorText.substring(0, 100)}...`);
    }

    return await response.json();
}