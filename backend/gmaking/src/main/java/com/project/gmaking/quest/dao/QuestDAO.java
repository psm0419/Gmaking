package com.project.gmaking.quest.dao;

import com.project.gmaking.quest.vo.QuestVO;
import com.project.gmaking.quest.vo.UserQuestVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface QuestDAO {

    /** 일일 퀘스트 전체 조회 (로그인 시 초기화용) */
    List<QuestVO> findAllDailyQuests();

    /** 유저가 특정 퀘스트를 가지고 있는지 확인 */
    UserQuestVO findByUserAndQuest(@Param("userId") String userId,
                                   @Param("questId") int questId);

    /** 유저 퀘스트 등록 */
    void insertUserQuest(UserQuestVO vo);

    /** 퀘스트 타입으로 조회 (PVE, PVP, DEBATE 등) */
    QuestVO findByType(@Param("questType") String questType);

    /** 유저 퀘스트 진행 업데이트 (기존 개별 업데이트용) */
    void updateProgress(UserQuestVO vo);

    /** 퀘스트 타입 기반 진행도 증가 (JOIN 방식) */
    int incrementProgressByType(@Param("userId") String userId,
                                @Param("questType") String questType);

    /** 유저 퀘스트 상태 변경 (예: COMPLETED → REWARDED) */
    void updateStatus(@Param("userId") String userId,
                      @Param("questId") int questId,
                      @Param("status") String status);

    /** 일일 퀘스트 리셋 (매일 자정) */
    int resetDailyQuests(@Param("today") LocalDate today);

    /** 특정 유저의 모든 일일 퀘스트 조회 */
    List<UserQuestVO> findUserDailyQuests(@Param("userId") String userId);
}
