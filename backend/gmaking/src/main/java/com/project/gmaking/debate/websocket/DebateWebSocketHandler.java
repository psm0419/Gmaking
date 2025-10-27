package com.project.gmaking.debate.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.gmaking.character.vo.CharacterVO;
import com.project.gmaking.character.vo.CharacterPersonalityVO;
import com.project.gmaking.debate.service.DebateService;
import com.project.gmaking.debate.vo.*;
import com.project.gmaking.quest.service.QuestService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;

import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class DebateWebSocketHandler implements WebSocketHandler {

    private final DebateService debateService;
    private final QuestService questService; // 퀘스트 직접 주입
    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        log.info("[Debate] WebSocket connected: {}", session.getId());
    }

    @Override
    public void handleMessage(WebSocketSession session, WebSocketMessage<?> message) {
        try {
            String payload = message.getPayload().toString();
            if (payload == null || payload.isBlank()) return;

            DebateRequestVO req = mapper.readValue(payload, DebateRequestVO.class);
            String topic = (req.getTopic() == null || req.getTopic().isBlank())
                    ? "누가 더 설득력 있는 영웅인가?" : req.getTopic();

            CharacterVO a = debateService.getCharacter(req.getCharacterAId());
            CharacterVO b = debateService.getCharacter(req.getCharacterBId());
            CharacterPersonalityVO aP = debateService.getPersonality(a.getCharacterPersonalityId());
            CharacterPersonalityVO bP = debateService.getPersonality(b.getCharacterPersonalityId());

            List<DebateLineVO> dialogue = new ArrayList<>();
            String lastLine = "";

            // 턴마다 실시간 진행
            for (int turn = 1; turn <= req.getTurnsPerSide(); turn++) {
                boolean firstTurn = (turn == 1);

                // A 발언
                String aLine = debateService.generateLine(
                        a.getCharacterName(), aP.getPersonalityDescription(),
                        b.getCharacterName(), lastLine, topic, firstTurn
                );
                if (aLine == null || aLine.isBlank())
                    aLine = a.getCharacterName() + "이(가) 첫 발언을 던진다!";
                dialogue.add(new DebateLineVO(a.getCharacterName(), aLine));
                sendJson(session, Map.of("type", "line", "speaker", a.getCharacterName(), "line", aLine));
                lastLine = aLine;
                Thread.sleep(800);

                // B 발언
                String bLine = debateService.generateLine(
                        b.getCharacterName(), bP.getPersonalityDescription(),
                        a.getCharacterName(), lastLine, topic, false
                );
                if (bLine == null || bLine.isBlank())
                    bLine = b.getCharacterName() + "이(가) 반박한다.";
                dialogue.add(new DebateLineVO(b.getCharacterName(), bLine));
                sendJson(session, Map.of("type", "line", "speaker", b.getCharacterName(), "line", bLine));
                lastLine = bLine;
                Thread.sleep(800);
            }

            // 오버레이 출력을 위한 end 메시지 전송
            sendJson(session, Map.of("type", "end"));


            // 퀘스트 갱신 (run()은 안 쓰지만 동일 효과)
            if (req.getUserId() != null && !req.getUserId().isBlank()) {
                questService.updateQuestProgress(req.getUserId(), "DEBATE");
                log.info("[퀘스트 업데이트 완료] userId={}, type=DEBATE", req.getUserId());
            }

            // 심사 결과
            Map<String, Object> verdict = debateService.judge(topic, dialogue);
            sendJson(session, Map.of(
                    "type", "verdict",
                    "winner", verdict.get("winner"),
                    "votes", verdict.get("votes"),
                    "comments", verdict.get("comments")
            ));

        } catch (Exception e) {
            log.error("[Debate] handleMessage error", e);
            try {
                sendJson(session, Map.of("type", "error", "message", "서버 오류"));
            } catch (Exception ignore) {}
        }
    }

    private void sendJson(WebSocketSession session, Map<String, ?> data) throws Exception {
        session.sendMessage(new TextMessage(mapper.writeValueAsString(data)));
    }

    @Override public void handleTransportError(WebSocketSession session, Throwable exception) { }
    @Override public void afterConnectionClosed(WebSocketSession session, CloseStatus status) { }
    @Override public boolean supportsPartialMessages() { return false; }
}
