package com.project.gmaking.notification.service;

import com.project.gmaking.notification.dao.NotificationDAO;
import com.project.gmaking.notification.vo.NotificationVO;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationDAO notificationDAO;
    private final SimpMessagingTemplate simp;




    @Transactional
    public Long create(String userId,
                       String type,
                       String title,
                       String message,
                       String linkUrl,
                       LocalDateTime expiresAt,
                       String metaJson,
                       String actor) {

        LocalDateTime now = LocalDateTime.now();

        NotificationVO vo = NotificationVO.builder()
                .userId(userId)
                .type(type)
                .title(title)
                .message(message)
                .linkUrl(linkUrl)
                .status("unread") // DB DEFAULT 쓰면 생략 가능
                .expiresAt(expiresAt)
                .metaJson(metaJson)
                .createdBy(actor)
                .createdDate(now)
                .updatedBy(actor)
                .updatedDate(now)
                .build();

        notificationDAO.insert(vo);

        // 커밋 후에만 stomp 로 1:1 전송
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override public void afterCommit() {
                // null 허용되는 Map 사용 (HashMap/LinkedHashMap 아무거나 가능)
                Map<String, Object> payload = new java.util.LinkedHashMap<>();

                payload.put("id",          vo.getNotificationId());
                payload.put("type",        vo.getType());
                payload.put("title",       vo.getTitle());
                payload.put("message",     vo.getMessage());     // null 가능
                payload.put("linkUrl",     vo.getLinkUrl());     // null 가능
                payload.put("status",      vo.getStatus());
                payload.put("metaJson",    vo.getMetaJson());    // null 가능
                payload.put("createdDate", vo.getCreatedDate());

                simp.convertAndSendToUser(userId, "/queue/notifications", payload);
            }
        });

        return vo.getNotificationId();
    }

    @Transactional(readOnly = true)
    public List<NotificationVO> getUnread(String userId, int limit, int offset) {
        return notificationDAO.selectUnread(userId, sanitizeLimit(limit), Math.max(offset, 0));
    }

    @Transactional(readOnly = true)
    public int countUnread(String userId) {
        return notificationDAO.countUnread(userId);
    }

    @Transactional(readOnly = true)
    public List<NotificationVO> getRead(String userId, int limit, int offset) {
        return notificationDAO.selectRead(userId, sanitizeLimit(limit), Math.max(offset, 0));
    }

    @Transactional
    public void markRead(String userId, int notificationId, String actor) {
        int updated = notificationDAO.markRead(notificationId, userId, actor);
    }

    @Transactional
    public int markAllRead(String userId, String actor) {
        return notificationDAO.markAllRead(userId, actor);
    }

    @Transactional
    public int deleteExpired() {
        return notificationDAO.deleteExpired();
    }

    // 소프트 삭제
    @Transactional
    public int softDeleteOne(String userId, int id, String updatedBy) {
        return notificationDAO.softDeleteOne(userId, id, updatedBy);
    }

    // 읽은 것만 소프트 삭제
    @Transactional
    public int softDeleteAllRead(String userId, String updatedBy) {
        return notificationDAO.softDeleteAllRead(userId, updatedBy);
    }

    private int sanitizeLimit(int limit) {
        if (limit <= 0) return 20;
        return Math.min(limit, 100);
    }

}
