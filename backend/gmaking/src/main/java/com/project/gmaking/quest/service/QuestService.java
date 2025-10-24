package com.project.gmaking.quest.service;

import com.project.gmaking.quest.vo.UserQuestVO;
import com.project.gmaking.quest.vo.QuestRewardResponseVO;
import java.util.List;

public interface QuestService {

    void resetDailyQuests(); // 매일 자정 등 스케줄러로 초기화
    void updateQuestProgress(String userId, String questType); // 퀘스트 진행 + 보상
    void initializeDailyQuests(String userId); // 로그인 시 초기 생성

    QuestRewardResponseVO rewardQuest(String userId, int questId); // 수동 보상 수령
    List<UserQuestVO> getUserDailyQuests(String userId); // 유저별 퀘스트 조회
}
