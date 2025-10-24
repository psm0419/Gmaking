package com.project.gmaking.character.service;

import com.project.gmaking.character.vo.CharacterGenerateResponseVO;
import reactor.core.publisher.Mono;

public interface CharacterStartService {

    /**
     * 캐릭터 생성 시작 시 부화권을 차감하고 새 토큰을 발급합니다.
     * @param userId 사용자 ID
     * @return 부화권 차감 성공 시, 새 토큰을 담은 응답 VO
     * @throws IllegalStateException 부화권 수량이 부족하거나 차감 DB 오류 발생 시
     */
    CharacterGenerateResponseVO startCharacterGeneration(String userId);
}