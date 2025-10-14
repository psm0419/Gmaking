package com.project.gmaking.notification.dao;

import com.project.gmaking.notification.vo.NotificationVO;
import org.apache.ibatis.annotations.Param;

import java.util.List;

public interface NotificationDAO {
    void insert(NotificationVO vo);

    // 미읽음 목록
    List<NotificationVO> selectUnread(
            @Param("userId") String userId,
            @Param("limit") int limit,
            @Param("offset") int offset
            );

    // 카운트
    int conuntUnread(@Param("userId") String userId);


    // 읽음 목록
    List<NotificationVO> selectRead(
            @Param("userId") String userId,
            @Param("limit") int limit,
            @Param("offset") int offset
    );

    // 읽음 처리
    int markRead(@Param("id") Long id,
                 @Param("userId") String userId,
                 @Param("updatedBy") String updatedBy
                 );

    // 전체 읽음 처리
    int markAllRead(@Param("userId") String userId,
                    @Param("updatedBy") String updatedBy);

    // 만료 알림 삭제
    int deleteExpired();


}
