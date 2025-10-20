package com.project.gmaking.notification.controller;


import com.project.gmaking.notification.service.NotificationModalService;
import com.project.gmaking.notification.service.NotificationService;
import com.project.gmaking.notification.vo.NotificationVO;
import com.project.gmaking.notification.vo.PvpResultModalVO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final NotificationModalService notificationModalService;

    private static final DateTimeFormatter ISO = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    // --- 조회 ---

    /* 미읽음 목록 (보낸시간 내림차순) */
    @GetMapping("/unread")
    public ResponseEntity<List<Map<String, Object>>> unread(
            Principal principal,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "0") int offset
    ) {
        String userId = principal.getName();
        List<NotificationVO> list = notificationService.getUnread(userId, limit, offset);
        return ResponseEntity.ok(list.stream().map(this::toResponse).toList());
    }

    /* 배지 카운트 (STATUS=unread) */
    @GetMapping("/unread/count")
    public ResponseEntity<Map<String, Integer>> unreadCount(Principal principal) {
        String userId = principal.getName();
        int count = notificationService.countUnread(userId);
        return ResponseEntity.ok(Map.of("count", count));
    }

    /* 읽음 목록 (보낸시간 내림차순) */
    @GetMapping("/read")
    public ResponseEntity<List<Map<String, Object>>> read(
            Principal principal,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "0") int offset
    ) {
        String userId = principal.getName();
        List<NotificationVO> list = notificationService.getRead(userId, limit, offset);
        return ResponseEntity.ok(list.stream().map(this::toResponse).toList());
    }

    // --- 업데이트 ---

    /* 단건 읽음 처리 */
    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markRead(
            Principal principal,
            @PathVariable int id
    ) {
        String userId = principal.getName();
        notificationService.markRead(userId, id, userId);
        return ResponseEntity.noContent().build();
    }

    /* 전체 읽음 처리 */
    @PatchMapping("/read-all")
    public ResponseEntity<Map<String, Integer>> markAllRead(Principal principal) {
        String userId = principal.getName();
        int changed = notificationService.markAllRead(userId, userId);
        return ResponseEntity.ok(Map.of("changed", changed));
    }

    /* 단건 소프트 삭제 */
    @PatchMapping("/{id}/delete")
    public ResponseEntity<Void> softDeleteOne(
            Principal principal,
            @PathVariable int id
    ) {
        String userId = principal.getName();
        int affected = notificationService.softDeleteOne(userId, id, userId);
        return affected == 0 ? ResponseEntity.notFound().build()
                            : ResponseEntity.noContent().build();
    }


    /* 전체 소프트 삭제 */
    @PatchMapping("/read/delete")
    public ResponseEntity<Map<String, Integer>> softDeleteAllRead(Principal principal) {
        String userId = principal.getName();
        int changed = notificationService.softDeleteAllRead(userId, userId);
        return ResponseEntity.ok(Map.of("changed", changed));
    }


    @DeleteMapping("/expired")
    public ResponseEntity<Map<String, Integer>> deleteExpired() {
        int deleted = notificationService.deleteExpired();
        return ResponseEntity.ok(Map.of("deleted", deleted));
    }

    // --- DTO 변환 ---

    private Map<String, Object> toResponse(NotificationVO n) {
        var m = new java.util.LinkedHashMap<String, Object>(10);
        m.put("id", n.getNotificationId());
        m.put("type", n.getType());
        m.put("title", n.getTitle());
        m.put("message", n.getMessage());
        m.put("linkUrl", n.getLinkUrl());              // null 허용
        m.put("status", n.getStatus());
        m.put("metaJson", n.getMetaJson());            // null 허용
        m.put("createdDate",
                n.getCreatedDate() == null ? null : ISO.format(n.getCreatedDate()));
        m.put("readAt",
                n.getReadAt() == null ? null : ISO.format(n.getReadAt()));
        return m;
    }

    @GetMapping("/{notificationId}/pvp-modal")
    public ResponseEntity<?> getPvpModal(
            @PathVariable Integer notificationId,
            Authentication auth
    ) {
        String userId = auth.getName();
        try {
            PvpResultModalVO vo = notificationModalService.getPvpModal(notificationId, userId);
            return ResponseEntity.ok(vo);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("서버 오류");
        }
    }

}
