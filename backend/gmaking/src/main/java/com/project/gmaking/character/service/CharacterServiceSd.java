package com.project.gmaking.character.service;

import com.project.gmaking.character.vo.CharacterGenerateRequestVO;
import com.project.gmaking.character.vo.CharacterGenerateResponseVO;
import reactor.core.publisher.Mono;
import java.io.IOException;

public interface CharacterServiceSd {

    /**
     * 캐릭터 생성의 전체 파이프라인을 실행.
     * 1. 이미지 분류 -> 2. 프롬프트 조합 -> 3. SD 생성 -> 4. GCS 저장 -> 5. DB 저장
     * @param requestVO React 요청 데이터
     * @param userId 요청을 보낸 사용자 ID (JWT 토큰에서 추출)
     * @return 생성된 캐릭터 정보
     */
    Mono<CharacterGenerateResponseVO> generateCharacter(CharacterGenerateRequestVO requestVO, String userId) throws IOException;
}