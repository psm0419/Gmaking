package com.project.gmaking.pve.websocket;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.gmaking.pve.service.PveBattleService;
import com.project.gmaking.pve.vo.MonsterVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
public class BattleWebSocketHandler extends TextWebSocketHandler {

    private final PveBattleService pveBattleService;
    private final ObjectMapper mapper = new ObjectMapper();
    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        String userId = (String) session.getAttributes().get("userId");
        System.out.println("WebSocket 연결 성공: " + session.getId() + ", userId=" + userId);
        sessions.put(session.getId(), session);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        try {
            Map<String, Object> data = mapper.readValue(message.getPayload(), new TypeReference<Map<String, Object>>() {});
            Integer characterId = Integer.parseInt(data.get("characterId").toString());
            Integer mapId = Integer.parseInt(data.get("mapId").toString());
            String userId = (String) session.getAttributes().get("userId"); //수정

            MonsterVO monster = pveBattleService.encounterMonster(mapId);
            String noteStyle = (String) data.getOrDefault("noteStyle", "COMIC");

            new Thread(() -> pveBattleService.startBattleWebSocket(session, characterId, monster, userId, noteStyle)).start();
        } catch (Exception e) {
            e.printStackTrace();
            try {
                session.sendMessage(new TextMessage("오류 발생: " + e.getMessage()));
            } catch (Exception ex) {
                ex.printStackTrace();
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, org.springframework.web.socket.CloseStatus status) {
        System.out.println("연결 종료: " + session.getId());
        sessions.remove(session.getId());
    }
}
