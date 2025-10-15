package com.project.gmaking.notification.facade;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.gmaking.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Map;

import static com.project.gmaking.notification.facade.NotificationTypes.*;

@Component
@RequiredArgsConstructor
public class NotificationFacade {
    private final NotificationService notificationService;
    private final ObjectMapper om = new ObjectMapper();

    // 구매 알림
    public Long purchase(String userId, String orderId, long amount, String actor) {
        String title = String.format("%s 를 구매했습니다.", orderId);

        String link = "/orders";
        String meta = json(Map.of(
                "orderId", orderId,
                "amount", amount
        ));
        return notificationService.create(
                userId, PURCHASE, title, null, link,
                LocalDateTime.now().plusDays(30), meta, actor
        );
    }

    // 랭크
    public Long ranking(String userId, int characterId, String characterName, int rank, String actor) {
        String name = safeName(characterName, 10);
        String title = String.format("%s%s가 랭크 %d위에 올랐습니다.", name, josaEGa(name), rank);
        String link  = "/ranking?characterId=" + characterId;;
        String meta  = json(Map.of("rank", rank));
        return notificationService.create(
                userId, "RANKING", title, null, link,
                LocalDateTime.now().plusDays(7), meta, actor
        );
    }

    // 댓글 : 해당 글로 이동
    public Long comment(String targetUserId, long postId, String commenter, String actor) {
        String title = "새 댓글이 달렸습니다";
        String link  = "/community/posts/" + postId;
        String meta  = json(Map.of("postId", postId, "commenter", commenter));
        return notificationService.create(targetUserId, "COMMENT", title, null, link,
                LocalDateTime.now().plusDays(14), meta, actor);
    }

    public Long pvpResult(String targetUserId, String isWinYn, String opponentUserId, String opponentName, long battleId, String actor) {
        boolean win = toBoolYn(isWinYn);
        String name = safeName(opponentName, 18);

        String title = String.format("%s%s의 전투에서 %s했습니다.",
                name, josaGwaWa(name), win ? "승리" : "패배");

        String link = null;

        String meta = json(Map.of(
                "battleId", battleId,
                "opponentUserId", opponentUserId,
                "opponentName", opponentName,
                "isWin", upYn(isWinYn),
                "result", win ? "WIN" : "LOSE"
        ));

        return notificationService.create(targetUserId, "PVP_RESULT", title, null, link, java.time.LocalDateTime.now().plusDays(30), meta, actor);
    }

    private String json(Object o) {
        try { return new ObjectMapper().writeValueAsString(o); }
        catch (Exception e) { return "{}"; }
    }

    private String safeName(String s, int max) {
        if (s == null) return "-";
        return s.length() <= max ? s : s.substring(0, Math.max(0, max - 1)) + "…";
    }

    private String josaEGa(String word) {
        if (word == null || word.isEmpty()) return "이"; // 기본
        char last = word.charAt(word.length() - 1);
        // 한글 범위: 0xAC00(가) ~ 0xD7A3(힣)
        if (last < 0xAC00 || last > 0xD7A3) return "이"; // 한글이 아니면 '이' 기본
        int base = last - 0xAC00;
        int jong = base % 28;           // 종성(받침)
        return (jong == 0) ? "가" : "이";
    }

    private boolean toBoolYn(String yn) {
        return yn != null && yn.trim().equalsIgnoreCase("Y");
    }
    private String upYn(String yn) {
        return (yn == null) ? "N" : (yn.trim().equalsIgnoreCase("Y") ? "Y" : "N");
    }

    // 한글 받침에 따라
    private String josaGwaWa(String word) {
        if (word == null || word.isEmpty()) return "과";
        char last = word.charAt(word.length() - 1);
        if (last < 0xAC00 || last > 0xD7A3) return "과";
        int jong = (last - 0xAC00) % 28;
        return (jong == 0) ? "와" : "과";
    }
}
