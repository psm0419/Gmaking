package com.project.gmaking.chat.dao;

import com.project.gmaking.chat.vo.ConversationVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

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


}
