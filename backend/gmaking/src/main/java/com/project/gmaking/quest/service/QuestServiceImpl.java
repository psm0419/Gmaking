package com.project.gmaking.quest.service;

import com.project.gmaking.quest.dao.InventoryDAO;
import com.project.gmaking.quest.dao.QuestDAO;
import com.project.gmaking.quest.vo.QuestVO;
import com.project.gmaking.quest.vo.UserQuestVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuestServiceImpl implements QuestService {

    private final QuestDAO questDAO;
    private final InventoryDAO inventoryDAO;

    @Override
    public void initializeDailyQuests(String userId) {
        List<QuestVO> allQuests = questDAO.findAllDailyQuests();
        for (QuestVO quest : allQuests) {
            UserQuestVO existing = questDAO.findByUserAndQuest(userId, quest.getQuestId());
            if (existing == null) {
                UserQuestVO newQuest = new UserQuestVO();
                newQuest.setUserId(userId);
                newQuest.setQuestId(quest.getQuestId());
                newQuest.setCurrentCount(0);
                newQuest.setStatus("IN_PROGRESS");
                questDAO.insertUserQuest(newQuest);
                log.info(">>> [퀘스트 생성] {} - {}", userId, quest.getQuestType());
            }
        }
    }

    @Override
    public void resetDailyQuests() {
        int updated = questDAO.resetDailyQuests(LocalDate.now());
        log.info("일일 퀘스트 {}건 초기화 완료", updated);
    }

    @Override
    public void updateQuestProgress(String userId, String questType) {
        log.info("[퀘스트 진행 업데이트 호출] userId={}, questType={}", userId, questType);

        int updated = questDAO.incrementProgressByType(userId, questType);
        log.info("[퀘스트 업데이트 결과] {}, updated={}", questType, updated);

        if ("PVE".equals(questType)) {
            int totalUpdated = questDAO.incrementProgressByType(userId, "PVE_TOTAL");
            log.info("[누적 PVE_TOTAL 업데이트] updated={}", totalUpdated);
        }

        QuestVO quest = questDAO.findByType(questType);
        if (quest == null) return;

        List<UserQuestVO> userQuests = questDAO.findUserDailyQuests(userId);
        userQuests.stream()
                .filter(uq -> uq.getQuestId() == quest.getQuestId())
                .filter(uq -> "COMPLETED".equals(uq.getStatus()))
                .findFirst()
                .ifPresent(uq -> {
                    giveReward(userId, quest);
                    questDAO.updateStatus(userId, quest.getQuestId(), "REWARDED");
                    log.info(">>> [퀘스트 완료] {} - 보상 지급 완료", quest.getQuestType());
                });
    }

    @Override
    public List<UserQuestVO> getUserDailyQuests(String userId) {
        return questDAO.findUserDailyQuests(userId);
    }

    // 보상 수령 (Controller에서 직접 호출)
    @Override
    public void rewardQuest(String userId, int questId) {
        UserQuestVO userQuest = questDAO.findByUserAndQuest(userId, questId);
        if (userQuest == null) {
            throw new IllegalArgumentException("해당 퀘스트가 존재하지 않습니다.");
        }
        if (!"COMPLETED".equals(userQuest.getStatus())) {
            throw new IllegalStateException("아직 완료되지 않은 퀘스트입니다.");
        }

        QuestVO quest = questDAO.findByType(userQuest.getQuestType());
        giveReward(userId, quest);
        questDAO.updateStatus(userId, questId, "REWARDED");
        log.info(">>> [보상 수령 완료] userId={}, questId={}", userId, questId);
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
