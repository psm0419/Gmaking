package com.project.gmaking.chat.dao;

import com.project.gmaking.chat.vo.ConversationSummaryVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ConversationSummaryDAO {

    /** 없으면 INSERT, 있으면 UPDATE (CONVERSATION_ID가 PK) */
    int upsertRollingSummary(ConversationSummaryVO vo);

    /** PK(=CONVERSATION_ID) 단건 조회 */
    ConversationSummaryVO selectByConversationId(@Param("conversationId") Integer conversationId);

    /** 요약만 갱신 (버전 +1, 길이 재계산) */
    int updateSummaryByConversationId(ConversationSummaryVO vo);

    /** PK 삭제 */
    int deleteByConversationId(@Param("conversationId") Integer conversationId);
}
