package com.project.gmaking.notification.service;

import com.project.gmaking.notification.dao.NotificationDAO;
import com.project.gmaking.notification.vo.NotificationVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationDAO notificationDAO;

//    @Transactional
//    public Long create(
//        String userId,
//        String type,
//        String title,
//        String message,
//        String linkUrl,
//        LocalDateTime expiresAt,
//        String metaJson,
//        String actor
//    ) {
//        NotificationVO vo =
//    }

}
