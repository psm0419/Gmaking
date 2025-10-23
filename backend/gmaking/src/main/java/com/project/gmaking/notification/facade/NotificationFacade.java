package com.project.gmaking.notification.facade;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.gmaking.character.dao.CharacterDAO;
import com.project.gmaking.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

import static com.project.gmaking.notification.facade.NotificationTypes.*;

@Component
@RequiredArgsConstructor
public class NotificationFacade {
    private final NotificationService notificationService;
    private final CharacterDAO characterDAO;
    private final ObjectMapper om = new ObjectMapper();

    // ===========================
    // 구매 알림
    // ===========================
    public Integer purchase(String userId, String orderId, String itemName, long amount, String actor) {
        String title = String.format("%s 를 구매했습니다.", orderId);
        String link = "/orders";
        String meta = json(Map.of(
                "orderId", orderId,
                "itemName", itemName,
                "amount", amount
        ));
        return notificationService.create(
                userId, PURCHASE, title, "", link,
                LocalDateTime.now().plusDays(30), meta, actor
        );
    }

    // ===========================
    // 랭킹 알림
    // ===========================
    public Integer ranking(String userId, int characterId, String characterName, int rank, String actor) {
        String name = safeName(characterName, 10);
        String title = String.format("%s%s가 랭크 %d위에 올랐습니다.", name, josaEGa(name), rank);
        String link = "/ranking?characterId=" + characterId;
        String meta = json(Map.of("rank", rank));
        return notificationService.create(
                userId, "RANKING", title, "", link,
                LocalDateTime.now().plusDays(7), meta, actor
        );
    }

    // ===========================
    // 댓글 알림
    // ===========================
    public Integer comment(String targetUserId, Integer postId, String commenter, String actor) {
        String title = "새 댓글이 달렸습니다";
        String link = "/community/posts/" + postId;
        String meta = json(Map.of("postId", postId, "commenter", commenter));
        return notificationService.create(
                targetUserId, "COMMENT", title, "", link,
                LocalDateTime.now().plusDays(14), meta, actor
        );
    }

    // ====================================================
    // ✅ PVP 결과 알림 (스탯 + 이미지 포함)
    // ====================================================
    public Integer pvpResult(
            String targetUserId,           // 알림 받을 사람
            boolean isWin,                 // 승패
            String opponentUserId,         // 상대 유저
            String opponentName,           // 상대 닉네임
            Integer battleId,              // 배틀 ID
            Integer opponentCharacterId,   // 상대 캐릭터 ID (재대결에 필요)
            String opponentImageUrl,       // 상대 캐릭터 이미지
            String requesterUserId,        // (수신자=나) 내 userId (재대결 seed)
            Integer requesterCharacterId,  // (수신자=나) 내 charId
            Integer hp, Integer atk, Integer def, Integer spd, Integer crit, // (옵션) 스탯
            String actor                   // 생성자 표시 (system 등)
    ) {

        Integer gradeId = fetchGradeIdSafe(opponentCharacterId);

        if (targetUserId == null || targetUserId.isBlank()) {
            throw new IllegalArgumentException("targetUserId is required");
        }
        final String name  = safeName(opponentName, 18);
        final String title = String.format("%s%s의 전투에서 %s했습니다.", name, josaGwaWa(name), isWin ? "승리" : "패배");
        final String link  = "/pvp/battles/" + battleId;

        //  메타 구성
        Map<String, Object> metaMap = new LinkedHashMap<>();
        metaMap.put("battleId", battleId);
        metaMap.put("isWin",   isWin ? "WIN" : "LOSE");
        metaMap.put("isWinYn", isWin ? "Y"   : "N");

        // 상대 정보 (모달/재대결에 사용)
        metaMap.put("opponentUserId", opponentUserId);
        metaMap.put("opponentName", opponentName);
        metaMap.put("displayOpponentName", name);
        metaMap.put("opponentCharacterId", opponentCharacterId); // 추가
        metaMap.put("opponentImageUrl", opponentImageUrl);
        metaMap.put("gradeId", gradeId);

        // 수신자 본인(재대결 시드)
        metaMap.put("requesterUserId", requesterUserId);         //  추가
        metaMap.put("requesterCharacterId", requesterCharacterId);// 추가

        // 상위 스탯(옵션)
        metaMap.put("hp", hp);
        metaMap.put("atk", atk);
        metaMap.put("def", def);
        metaMap.put("spd", spd);
        metaMap.put("crit", crit);

        // 하위 객체(stats)
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("gradeId", gradeId);
        stats.put("hp", hp);
        stats.put("atk", atk);
        stats.put("def", def);
        stats.put("spd", spd);
        stats.put("crit", crit);
        metaMap.put("stats", stats);

        final String meta = json(metaMap);
        final String safeActor = (actor == null || actor.isBlank()) ? "system" : actor;

        return notificationService.create(
                targetUserId, "PVP_RESULT", title, "", link,
                LocalDateTime.now().plusDays(30), meta, safeActor
        );
    }

    // ====================================================
    // 🔧 공통 유틸
    // ====================================================

    private Integer fetchGradeIdSafe(Integer characterId) {
        if (characterId == null) return null;
        try {
            return characterDAO.selectGradeIdByCharacterId(characterId);
        } catch (Exception e) {
            return null; // 조회 실패 시 null
        }
    }
    private String json(Object o) {
        try { return om.writeValueAsString(o); }
        catch (Exception e) { return "{}"; }
    }

    private String safeName(String s, int max) {
        if (s == null) return "-";
        return s.length() <= max ? s : s.substring(0, Math.max(0, max - 1)) + "…";
    }

    private String josaEGa(String word) {
        if (word == null || word.isEmpty()) return "이";
        char last = word.charAt(word.length() - 1);
        if (last < 0xAC00 || last > 0xD7A3) return "이";
        int base = last - 0xAC00;
        int jong = base % 28;
        return (jong == 0) ? "가" : "이";
    }

    private boolean toBoolYn(String yn) {
        return yn != null && yn.trim().equalsIgnoreCase("Y");
    }

    private String upYn(String yn) {
        return (yn == null) ? "N" : (yn.trim().equalsIgnoreCase("Y") ? "Y" : "N");
    }

    private String josaGwaWa(String word) {
        if (word == null || word.isEmpty()) return "과";
        char last = word.charAt(word.length() - 1);
        if (last < 0xAC00 || last > 0xD7A3) return "과";
        int jong = (last - 0xAC00) % 28;
        return (jong == 0) ? "와" : "과";
    }
}
