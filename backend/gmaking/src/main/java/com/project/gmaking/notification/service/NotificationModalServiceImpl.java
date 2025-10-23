
package com.project.gmaking.notification.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.gmaking.notification.dao.NotificationDAO;
import com.project.gmaking.notification.vo.NotificationVO;
import com.project.gmaking.notification.vo.PvpResultModalVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationModalServiceImpl implements NotificationModalService {

    private final NotificationDAO notificationDAO;
    private final ObjectMapper objectMapper; // 없으면: = new ObjectMapper();

    @Override
    public PvpResultModalVO getPvpModal(Integer notificationId, String viewerUserId) {
        NotificationVO row = notificationDAO.selectOneByIdAndUserForPvp(notificationId, viewerUserId);
        if (row == null) {
            throw new IllegalArgumentException("알림이 없거나 권한이 없습니다.");
        }

        JsonNode meta = parseJson(row.getMetaJson());

        // 결과값: isWin("WIN"/"LOSE") 우선, 없으면 isWinYn("Y"/"N") 변환
        String result = text(meta, "isWin");
        if (isBlank(result)) {
            String yn = text(meta, "isWinYn");
            result = "Y".equalsIgnoreCase(yn) ? "WIN" : "LOSE";
        }

        PvpResultModalVO vo = new PvpResultModalVO();
        vo.setNotificationId(row.getNotificationId());
        vo.setBattleId(intOrNull(meta, "battleId"));
        vo.setResult(result);

        vo.setOpponentUserId(text(meta, "opponentUserId"));
        vo.setOpponentNickname(firstNonBlank(text(meta, "opponentName"), text(meta, "displayOpponentName")));
        vo.setOpponentCharacterId(intOrNull(meta, "opponentCharacterId"));
        vo.setOpponentCharacterName(text(meta, "opponentCharacterName"));
        vo.setOpponentImageUrl(text(meta, "opponentImageUrl"));

        Integer gradeId = intOrNull(meta, "gradeId");
        vo.setGradeId(gradeId);

        vo.setHp(intOrNull(meta, "hp"));
        vo.setAtk(intOrNull(meta, "atk"));
        vo.setDef(intOrNull(meta, "def"));
        vo.setSpd(intOrNull(meta, "spd"));
        vo.setCrit(intOrNull(meta, "crit"));

        return vo;
    }

    // ===== Helpers =====
    private JsonNode parseJson(String json) {
        if (json == null || json.isBlank()) return objectMapper.createObjectNode();
        try {
            return objectMapper.readTree(json);
        } catch (Exception e) {
            // 파싱 실패 시 비어있는 객체로 대체 (원하면 throw로 바꿔도 됨)
            return objectMapper.createObjectNode();
        }
    }

    private String text(JsonNode n, String field) {
        return (n != null && n.has(field) && !n.get(field).isNull()) ? n.get(field).asText() : null;
    }

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    private String firstNonBlank(String a, String b) {
        return !isBlank(a) ? a : (!isBlank(b) ? b : null);
    }

    private Integer intOrNull(JsonNode n, String field) {
        if (n == null || !n.has(field) || n.get(field).isNull()) return null;
        JsonNode v = n.get(field);
        if (v.isNumber()) return v.asInt();
        if (v.isTextual()) {
            try { return Integer.parseInt(v.asText().trim()); } catch (NumberFormatException ignore) {}
        }
        return null;
    }
}
