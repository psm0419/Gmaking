package com.project.gmaking.quest.dao;

import com.project.gmaking.quest.vo.QuestVO;
import com.project.gmaking.quest.vo.UserQuestVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface QuestDAO {

    /** 1. 일일 퀘스트 전체 조회 (로그인 시 초기화용) */
    List<QuestVO> findAllDailyQuests();

    /** 2. 유저가 특정 퀘스트를 가지고 있는지 확인 */
    UserQuestVO findByUserAndQuest(@Param("userId") String userId,
                                   @Param("questId") int questId);

    /** 3. 유저 퀘스트 등록 */
    void insertUserQuest(UserQuestVO vo);

    /** 4. 퀘스트 타입으로 조회 (예: 'PVE', 'DEBATE', ...) */
    QuestVO findByType(@Param("questType") String questType);

    /** 4-1. 퀘스트 ID로 조회 (보상 지급 시 필요) */
    QuestVO findById(@Param("questId") int questId);

    /** 5. 유저 퀘스트 진행 업데이트 (직접 값 지정 시) */
    void updateProgress(UserQuestVO vo);

    /** 6. 퀘스트 타입 기반 진행도 +1 (JOIN 방식) */
    int incrementProgressByType(@Param("userId") String userId,
                                @Param("questType") String questType);

    /** 7. 유저 퀘스트 상태 변경 (예: COMPLETED → REWARDED) */
    void updateStatus(@Param("userId") String userId,
                      @Param("questId") int questId,
                      @Param("status") String status);

    /** 8. 일일 퀘스트 리셋 (매일 자정) */
    int resetDailyQuests(@Param("today") LocalDate today);

    /** 9. 특정 유저의 모든 일일 퀘스트 조회 */
    List<UserQuestVO> findUserDailyQuests(@Param("userId") String userId);
}
