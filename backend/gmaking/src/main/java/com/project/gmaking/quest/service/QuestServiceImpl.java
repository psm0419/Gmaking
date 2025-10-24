package com.project.gmaking.quest.service;

import com.project.gmaking.quest.dao.InventoryDAO;
import com.project.gmaking.quest.dao.QuestDAO;
import com.project.gmaking.quest.vo.QuestVO;
import com.project.gmaking.quest.vo.UserQuestVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuestServiceImpl implements QuestService {

    private final QuestDAO questDAO;
    private final InventoryDAO inventoryDAO;

    @Override
    public void resetDailyQuests() {
        int updated = questDAO.resetDailyQuests(LocalDate.now());
        log.info("일일 퀘스트 {}건 초기화 완료", updated);
    }

    @Override
    public void updateQuestProgress(String userId, String questType) {
        QuestVO quest = questDAO.findByType(questType);
        if (quest == null) return;

        UserQuestVO userQuest = questDAO.findByUserAndQuest(userId, quest.getQuestId());
        if (userQuest == null) {
            userQuest = new UserQuestVO();
            userQuest.setUserId(userId);
            userQuest.setQuestId(quest.getQuestId());
            userQuest.setCurrentCount(0);
            userQuest.setStatus("IN_PROGRESS");
            questDAO.insertUserQuest(userQuest);
        }

        int newCount = userQuest.getCurrentCount() + 1;
        userQuest.setCurrentCount(newCount);

        if (newCount >= quest.getTargetCount() && !"COMPLETED".equals(userQuest.getStatus())) {
            userQuest.setStatus("COMPLETED");
            userQuest.setCompletedAt(LocalDateTime.now());
            giveReward(userId, quest);
            questDAO.updateStatus(userId, quest.getQuestId(), "REWARDED");
            log.info("퀘스트 [{}] 완료 - 유저ID: {}, 보상 지급 완료", quest.getQuestName(), userId);
        } else {
            questDAO.updateProgress(userQuest);
        }
    }

    private void giveReward(String userId, QuestVO quest) {
        int productId = quest.getRewardProductId();
        int rewardQty = quest.getRewardQuantity();

        int updated = inventoryDAO.addQuantity(userId, productId, rewardQty);
        if (updated == 0) {
            inventoryDAO.insert(userId, productId, rewardQty);
        }
    }
}
