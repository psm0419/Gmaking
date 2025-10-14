package com.project.gmaking.chat.dao;

import com.project.gmaking.chat.constant.ConversationStatus;
import com.project.gmaking.chat.vo.ConversationVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ConversationDAO {

    ConversationVO selectConversationByUserAndCharacter(
            @Param("userId") String userId,
            @Param("characterId") Integer characterId
    );

    String selectCallingName(@Param("conversationId") Integer conversationId);

    int updateFirstMeetFlag(
            @Param("conversationId") Integer conversationId,
            @Param("isFirstMeet") Boolean isFirstMeet,
            @Param("actor") String actor
    );

    // calling_name 업데이트
    int updateCallingName(@Param("conversationId") Integer conversationId,
                          @Param("callingName") String callingName,
                          @Param("actor") String actor);

    ConversationVO selectById(@Param("conversationId") Integer conversationId);

    // 상태별 대화방 목록(open - 삭제 x, close - 삭제)
    List<Integer> findConversationIdsByStatusPaged(@Param("status") ConversationStatus status,
                                                   @Param("limit") int limit);

    // 오픈 상태의 대화 delay_log_clean = 1 로 설정
    int markDelayLogCleanForOpen();

    // delay_log_clean 조회
    Boolean selectDelayLogCleanForUpdate(@Param("conversationId") Integer conversationId);

    // delay_log_clean 값 변경
    int updateDelayLogClean(@Param("conversationId") Integer conversationId,
                            @Param("delay") boolean delay,
                            @Param("actor") String actor);

    // updated_date 갱신
    int touch(@Param("conversationId") Integer conversationId,
              @Param("actor") String actor);

    // 스케줄러
    int updateStatus(@Param("conversationId") Integer conversationId,
                     @Param("status") ConversationStatus status,
                     @Param("actor") String actor);

    Integer findLatestOpenConversationId(
            @Param("userId") String userId,
            @Param("characterId") Integer characterId
    );
    int closeConversation(
            @Param("conversationId") Integer conversationId,
            @Param("userId") String userId
    );
}
