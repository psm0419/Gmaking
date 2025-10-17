package com.project.gmaking.character.service;

import com.project.gmaking.character.vo.CharacterGenerateRequestVO;
import com.project.gmaking.character.vo.CharacterGenerateResponseVO;
import reactor.core.publisher.Mono;
import java.io.IOException;

public interface CharacterServiceGpt {
    /**
     * 캐릭터 미리보기 생성 (이미지 분류, GPT 이미지 생성)
     * - DB 저장 (X), GCS 임시 저장 (O)
     * @param requestVO React 요청 데이터
     * @param userId 요청을 보낸 사용자 ID
     * @return 생성된 이미지 URL, 예측 동물 정보
     */
    Mono<CharacterGenerateResponseVO> generateCharacterPreview(CharacterGenerateRequestVO requestVO, String userId) throws IOException;

    /**
     *  캐릭터 최종 확정 (DB 저장 및 JWT 토큰 재발급)
     * - DB 저장 (O)
     * @param finalData 미리보기에서 받은 최종 데이터
     * @param userId 요청을 보낸 사용자 ID
     * @return 최종 응답 VO (newToken 포함)
     */
    CharacterGenerateResponseVO finalizeCharacter(CharacterGenerateResponseVO finalData, String userId);
}