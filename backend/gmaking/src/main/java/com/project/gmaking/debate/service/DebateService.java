// DebateService.java
package com.project.gmaking.debate.service;

import com.project.gmaking.character.vo.CharacterPersonalityVO;
import com.project.gmaking.character.vo.CharacterVO;
import com.project.gmaking.debate.vo.DebateLineVO;
import com.project.gmaking.debate.vo.DebateRequestVO;
import com.project.gmaking.debate.vo.DebateResultVO;

import java.util.List;
import java.util.Map;

public interface DebateService {
    DebateResultVO run(DebateRequestVO req);

    // WebSocket용 공개 메서드
    CharacterVO getCharacter(Integer characterId);
    CharacterPersonalityVO getPersonality(Integer personalityId);

    // 한 캐릭터의 대사를 생성(턴 단위)
    String generateLine(String me, String myPersonality,
                        String opponent, String opponentLast,
                        String topic, boolean isFirstTurn);

    // 심사만 따로 실행하고 결과만 받고 싶을 때
    Map<String, Object> judge(String topic, List<DebateLineVO> dialogue);
}
