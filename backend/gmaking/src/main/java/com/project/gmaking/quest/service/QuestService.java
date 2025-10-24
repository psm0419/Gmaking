package com.project.gmaking.quest.service;

import com.project.gmaking.quest.vo.UserQuestVO;

import java.util.List;

public interface QuestService {

    void resetDailyQuests();
    void updateQuestProgress(String userId, String questType);
    void initializeDailyQuests(String userId);
    // 보상 수령
    void rewardQuest(String userId, int questId);

    // 유저의 일일 퀘스트 조회용 (Controller에서 사용)
    List<UserQuestVO> getUserDailyQuests(String userId);
}
