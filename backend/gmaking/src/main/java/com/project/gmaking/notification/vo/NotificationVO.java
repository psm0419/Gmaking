package com.project.gmaking.notification.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationVO {
    private Integer notificationId;
    private String userId;
    private String type;
    private String title;
    private String message;
    private String linkUrl;
    private String status;

    private LocalDateTime deliveredAt;
    private LocalDateTime expiresAt;
    private LocalDateTime readAt;
    private LocalDateTime createdDate;
    private String createdBy;
    private LocalDateTime updatedDate;
    private String updatedBy;
    private String metaJson;
}
