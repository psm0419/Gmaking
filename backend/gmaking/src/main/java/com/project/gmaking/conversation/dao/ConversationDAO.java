package com.project.gmaking.conversation.dao;

import com.project.gmaking.conversation.vo.ConversationVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface ConversationDAO {
    int insert(ConversationVO c);
    ConversationVO findById(@Param("id") int conversationId);
}
