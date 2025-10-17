package com.project.gmaking.notification.service;

import com.project.gmaking.notification.vo.PvpResultModalVO;

public interface NotificationModalService {
    PvpResultModalVO getPvpModal(Integer notificationId, String viewerUserId);
}
