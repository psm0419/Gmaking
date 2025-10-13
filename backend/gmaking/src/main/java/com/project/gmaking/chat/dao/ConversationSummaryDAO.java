package com.project.gmaking.chat.dao;

import com.project.gmaking.chat.vo.ConversationSummaryVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ConversationSummaryDAO {

    int insert(ConversationSummaryVO vo);

    ConversationSummaryVO selectById(@Param("memoryId") Integer memoryId);

    /* 해당 대화의 가장 최근 롱메모리 한 건 */
    ConversationSummaryVO selectLatestByConversationId(@Param("conversationId") Integer conversationId);

    /* 해당 대화의 롱메모리 목록 (최신순, 페이징) */
    List<ConversationSummaryVO> selectByConversationId(
            @Param("conversationId") Integer conversationId,
            @Param("limit") Integer limit,
            @Param("offset") Integer offset
    );

    /* 요약 내용만 갱신 */
    int updateSummaryById(
            @Param("memoryId") Integer memoryId,
            @Param("summary") String summary,
            @Param("updatedBy") String updatedBy
    );

    int deleteById(@Param("memoryId") Integer memoryId);

    int deleteByConversationId(@Param("conversationId") Integer conversationId);
}
