const API_BASE_URL = 'http://localhost:8080';

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

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '알 수 없는 서버 오류' }));
        const errorMessage = errorData.message || response.statusText;
        throw new Error(`캐릭터 미리보기 생성 실패: ${errorMessage}`);
    }

    return await response.json();
}

/**
 * 캐릭터 최종 확정 API 호출 함수 (DB 저장 및 토큰 갱신)
 * @param {object} characterData 생성된 캐릭터 정보 (characterName, imageUrl, predictedAnimal 포함)
 * @param {string} token JWT 토큰
 * @returns {Promise<object>} API 응답 JSON
 */
export async function finalizeCharacter(characterData, token) { // 💡 인자 변경
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