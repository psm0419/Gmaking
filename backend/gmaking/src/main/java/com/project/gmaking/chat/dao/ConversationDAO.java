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

    int updateFirstMeetFlag(
            @Param("conversationId") Integer conversationId,
            @Param("isFirstMeet") Boolean isFirstMeet,
            @Param("actor") String actor
    );
}
