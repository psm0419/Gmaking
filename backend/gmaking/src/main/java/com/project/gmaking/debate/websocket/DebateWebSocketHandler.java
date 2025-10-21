package com.project.gmaking.debate.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.gmaking.character.vo.CharacterVO;
import com.project.gmaking.character.vo.CharacterPersonalityVO;
import com.project.gmaking.debate.service.DebateService;
import com.project.gmaking.debate.vo.DebateLineVO;
import com.project.gmaking.debate.vo.DebateRequestVO;
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
    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        log.info("[debate] ws connected: {}", session.getId());
    }

    @Override
    public void handleMessage(WebSocketSession session, WebSocketMessage<?> message) {
        try {
            // 클라이언트에서 빈 메시지 보낼 경우 무시
            if (message.getPayload() == null || message.getPayload().toString().isBlank()) {
                log.info("[debate] 빈 메시지 수신 → 무시");
                return;
            }

            DebateRequestVO req = mapper.readValue(message.getPayload().toString(), DebateRequestVO.class);
            String topic = (req.getTopic() == null || req.getTopic().isBlank())
                    ? "누가 더 설득력 있는 영웅인가?" : req.getTopic();

            CharacterVO a = debateService.getCharacter(req.getCharacterAId());
            CharacterVO b = debateService.getCharacter(req.getCharacterBId());
            CharacterPersonalityVO aP = debateService.getPersonality(a.getCharacterPersonalityId());
            CharacterPersonalityVO bP = debateService.getPersonality(b.getCharacterPersonalityId());


            // 캐릭터 메타데이터 전송
            sendJson(session, Map.of(
                    "type", "meta",
                    "topic", topic,
                    "a", Map.of("id", a.getCharacterId(), "name", a.getCharacterName(), "imageUrl", a.getImageUrl()),
                    "b", Map.of("id", b.getCharacterId(), "name", b.getCharacterName(), "imageUrl", b.getImageUrl())
            ));

            List<DebateLineVO> dialogue = new ArrayList<>(req.getTurnsPerSide() * 2);
            String lastLine = "";

            for (int turn = 1; turn <= req.getTurnsPerSide(); turn++) {
                boolean isFirstTurn = (turn == 1);

                // A 발언 생성
                String aLine = debateService.generateLine(
                        a.getCharacterName(), aP.getPersonalityDescription(),
                        b.getCharacterName(), lastLine, topic, isFirstTurn
                );

                // ✅ 빈문장 보정 (첫턴이든 아니든 모두 처리)
                if (aLine == null || aLine.isBlank()) {
                    if (isFirstTurn) {
                        aLine = a.getCharacterName() + "이(가) 힘찬 첫 발언을 시작한다!";
                    } else {
                        aLine = "나는 언제나 준비된 영웅이지!";
                    }
                }

                // ✅ 이제 확실히 전송
                dialogue.add(new DebateLineVO(a.getCharacterName(), aLine));
                sendJson(session, Map.of(
                        "type", "line",
                        "turn", turn,
                        "speakerId", a.getCharacterId(),
                        "speaker", a.getCharacterName(),
                        "imageUrl", a.getImageUrl(),
                        "line", aLine
                ));
                lastLine = aLine;

                // --- B 발언 ---
                String bLine = debateService.generateLine(
                        b.getCharacterName(), bP.getPersonalityDescription(),
                        a.getCharacterName(), lastLine, topic, false
                );

                if (bLine == null || bLine.isBlank()) {
                    bLine = "그 정도로는 날 설득할 수 없지.";
                }

                dialogue.add(new DebateLineVO(b.getCharacterName(), bLine));
                sendJson(session, Map.of(
                        "type", "line",
                        "turn", turn,
                        "speakerId", b.getCharacterId(),
                        "speaker", b.getCharacterName(),
                        "imageUrl", b.getImageUrl(),
                        "line", bLine
                ));
                lastLine = bLine;
            }

            // 심사 및 결과 전송
            Map<String, Object> verdict = debateService.judge(topic, dialogue);
            sendJson(session, Map.of(
                    "type", "verdict",
                    "votes", verdict.get("votes"),
                    "comments", verdict.get("comments"),
                    "winner", verdict.get("winner")
            ));

            // 종료 신호
            sendJson(session, Map.of("type", "end"));

        } catch (Exception e) {
            log.error("[debate] handleMessage error", e);
            try {
                sendJson(session, Map.of("type", "error", "message", "server error"));
            } catch (Exception ignore) {}
        }
    }

    private void sendJson(WebSocketSession session, Map<String, ?> payload) throws Exception {
        session.sendMessage(new TextMessage(mapper.writeValueAsString(payload)));
    }

    @Override public void handleTransportError(WebSocketSession session, Throwable exception) { }
    @Override public void afterConnectionClosed(WebSocketSession session, CloseStatus status) { }
    @Override public boolean supportsPartialMessages() { return false; }
}
