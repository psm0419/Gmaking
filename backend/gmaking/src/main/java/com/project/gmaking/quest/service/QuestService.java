package com.project.gmaking.quest.service;

public interface QuestService {

    void resetDailyQuests();
    void updateQuestProgress(String userId, String questType);
}
