package com.project.gmaking.character.service;

import com.project.gmaking.character.vo.CharacterGenerateRequestVO;
import com.project.gmaking.character.vo.CharacterGenerateResponseVO;
import reactor.core.publisher.Mono;
import java.io.IOException;

public interface CharacterServiceGpt {
    /**
     * 캐릭터 생성의 전체 파이프라인을 실행.
     * 1. 이미지 분류 -> 2. GPT(DALL-E)로 이미지 생성 -> 3. GCS 저장 -> 4. DB 저장
     * @param requestVO React 요청 데이터
     * @param userId 요청을 보낸 사용자 ID (JWT 토큰에서 추출)
     * @return 생성된 캐릭터 정보
     */
    Mono<CharacterGenerateResponseVO> generateCharacter(CharacterGenerateRequestVO requestVO, String userId) throws IOException;
}