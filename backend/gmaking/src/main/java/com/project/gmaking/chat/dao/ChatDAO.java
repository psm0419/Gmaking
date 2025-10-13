package com.project.gmaking.chat.dao;

import com.project.gmaking.chat.vo.DialogueVO;
import com.project.gmaking.chat.vo.PersonaVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;


import java.util.List;

@Mapper
public interface ChatDAO {
    // 기존의 대화방 검색
    Integer findLatestConversationId(@Param("userId") String userId,
                                     @Param("characterId") Integer characterId);

    // 새로운 대화방 생성
    int createConversation(@Param("userId") String userId,
                           @Param("characterId") Integer characterId,
                           @Param("actor") String actor);

    // 대화 내역 추가
    int insertDialogue(DialogueVO vo);

    List<DialogueVO> selectRecentDialogues(@Param("conversationId") Integer conversationId,
                                           @Param("limit") int limit);

    PersonaVO selectPersonaByCharacterId(@Param("characterId") Integer characterId);

    // 유저가 대화방에 보낸 메세지 개수
    int countUserMessages(@Param("conversationId") Integer conversationId);

    // 캐릭터 메시지 개수
    int countCharacterMessages(@Param("conversationId") Integer conversationId);

    // (중복 방지) 캐릭터 메시지 최신 1개만 남기고 나머지 삭제
    int deleteOldCharacterMessagesExceptLatest(@Param("conversationId") Integer conversationId);

    int countAllMessagesToday(@Param("conversationId") Integer conversationId);

    int deleteDialoguesByConversationId(@Param("conversationId") Integer conversationId);

    // 스케줄러 돌리려고
    int countByConversationId(@org.apache.ibatis.annotations.Param("conversationId") Integer conversationId);

    int insertSystemEvent(
            @Param("conversationId") Integer conversationId,
            @Param("content") String content,
            @Param("actor") String actor
    );
}
