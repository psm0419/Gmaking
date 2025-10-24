package com.project.gmaking.quest.dao;

import com.project.gmaking.quest.vo.QuestVO;
import com.project.gmaking.quest.vo.UserQuestVO;
import org.apache.ibatis.annotations.*;

import java.time.LocalDate;

@Mapper
public interface QuestDAO {

    // 일일 퀘스트 리셋
    int resetDailyQuests(@Param("today") LocalDate today);

    // 퀘스트 조회 (타입으로 찾기)
    QuestVO findByType(@Param("questType") String questType);

    // 유저 퀘스트 조회
    UserQuestVO findByUserAndQuest(@Param("userId") String userId, @Param("questId") int questId);

    // 신규 유저 퀘스트 추가
    void insertUserQuest(UserQuestVO vo);

    // 진행도 업데이트
    void updateProgress(UserQuestVO vo);

    // 상태 변경
    void updateStatus(@Param("userId") String userId, @Param("questId") int questId, @Param("status") String status);
}
