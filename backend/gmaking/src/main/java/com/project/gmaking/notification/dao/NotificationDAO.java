package com.project.gmaking.notification.dao;

import com.project.gmaking.notification.vo.NotificationVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface NotificationDAO {
    void insert(NotificationVO vo);

    // 미읽음 목록
    List<NotificationVO> selectUnread(
            @Param("userId") String userId,
            @Param("limit") int limit,
            @Param("offset") int offset
            );

    // 카운트
    int countUnread(@Param("userId") String userId);


    // 읽음 목록
    List<NotificationVO> selectRead(
            @Param("userId") String userId,
            @Param("limit") int limit,
            @Param("offset") int offset
    );

    // 읽음 처리
    int markRead(@Param("id") Integer id,
                 @Param("userId") String userId,
                 @Param("updatedBy") String updatedBy
                 );

    // 전체 읽음 처리
    int markAllRead(@Param("userId") String userId,
                    @Param("updatedBy") String updatedBy);

    // 만료 알림 삭제
    int deleteExpired();

    // 소프트 단건 삭제
    int softDeleteOne(@Param("userId") String userId,
                      @Param("id") Integer id,
                      @Param("updatedBy") String updatedBy);

    // 소프트 전체 삭제
    int softDeleteAllRead(@Param("userId") String userId,
                          @Param("updatedBy") String updatedBy);

    // pvp 결과 모달용
    NotificationVO selectOneByIdAndUserForPvp(
            @Param("notificationId") Integer notificationId,
            @Param("userId") String userId
    );


}
