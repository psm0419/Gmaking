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
                Map<String, Object> payload = Map.of(
                        "id", vo.getNotificationId(),
                        "type", vo.getType(),
                        "title", vo.getTitle(),
                        "message", vo.getMessage(),
                        "linkUrl", vo.getLinkUrl(),
                        "status", vo.getStatus(),      // unread
                        "metaJson", vo.getMetaJson(),
                        "createdDate", vo.getCreatedDate()
                );
                // 온라인이면 토스트; 오프라인이면 그냥 무시(REST로 미읽음 보전)
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
