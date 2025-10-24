package com.project.gmaking.quest.service;

import com.project.gmaking.quest.dao.InventoryDAO;
import com.project.gmaking.quest.dao.QuestDAO;
import com.project.gmaking.quest.vo.QuestVO;
import com.project.gmaking.quest.vo.UserQuestVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuestServiceImpl implements QuestService {

    private final QuestDAO questDAO;
    private final InventoryDAO inventoryDAO;

    /**
     * 유저의 일일 퀘스트가 없으면 생성
     */
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
                log.info("[퀘스트 생성] userId={}, type={}", userId, quest.getQuestType());
            }
        }
    }

    /**
     * 일일 퀘스트 리셋
     */
    @Override
    public void resetDailyQuests() {
        int updated = questDAO.resetDailyQuests(LocalDate.now());
        log.info("일일 퀘스트 {}건 초기화 완료", updated);
    }

    /**
     * 퀘스트 진행도 업데이트 및 자동 보상 지급
     */
    @Override
    @Transactional
    public void updateQuestProgress(String userId, String questType) {
        log.info("[퀘스트 진행 업데이트] userId={}, questType={}", userId, questType);

        int updated = questDAO.incrementProgressByType(userId, questType);
        if (updated == 0) return; // 진행할 퀘스트 없음

        // 목표 달성 여부 확인
        QuestVO quest = questDAO.findByType(questType);
        if (quest == null) return;

        UserQuestVO userQuest = questDAO.findByUserAndQuest(userId, quest.getQuestId());
        if (userQuest == null) return;

        if (userQuest.getCurrentCount() >= quest.getTargetCount() &&
                !"REWARDED".equals(userQuest.getStatus())) {

            // 상태 완료 처리
            questDAO.updateStatus(userId, quest.getQuestId(), "COMPLETED");

            // 보상 지급
            giveReward(userId, quest);

            // 지급 완료 표시
            questDAO.updateStatus(userId, quest.getQuestId(), "REWARDED");

            log.info("[퀘스트 완료 및 보상 지급] userId={}, questType={}, reward={}x{}",
                    userId, questType, quest.getRewardProductId(), quest.getRewardQuantity());
        }
    }

    /**
     * 유저의 일일 퀘스트 목록 조회
     */
    @Override
    public List<UserQuestVO> getUserDailyQuests(String userId) {
        return questDAO.findUserDailyQuests(userId);
    }

    /**
     * 수동 보상 수령 (컨트롤러 직접 호출용)
     */
    @Override
    @Transactional
    public void rewardQuest(String userId, int questId) {
        UserQuestVO userQuest = questDAO.findByUserAndQuest(userId, questId);
        if (userQuest == null) throw new IllegalArgumentException("해당 퀘스트가 존재하지 않습니다.");
        if (!"COMPLETED".equals(userQuest.getStatus()))
            throw new IllegalStateException("아직 완료되지 않은 퀘스트입니다.");

        QuestVO quest = questDAO.findById(questId);
        if (quest == null) throw new IllegalArgumentException("퀘스트 정의를 찾을 수 없습니다.");

        giveReward(userId, quest);
        questDAO.updateStatus(userId, questId, "REWARDED");

        log.info("[수동 보상 지급 완료] userId={}, questId={}, reward={}x{}",
                userId, questId, quest.getRewardProductId(), quest.getRewardQuantity());
    }

    /**
     * 보상 지급 처리
     */
    @Transactional
    private void giveReward(String userId, QuestVO quest) {
        int productId = quest.getRewardProductId();
        int qty = quest.getRewardQuantity();

        int updated = inventoryDAO.addQuantity(userId, productId, qty);
        if (updated == 0) {
            inventoryDAO.insert(userId, productId, qty);
        }
        // TB_USER.INCUBATOR_COUNT 최신화
        inventoryDAO.refreshUserIncubatorCache(userId);

        log.info("[보상 지급] userId={}, productId={}, quantity={}", userId, productId, qty);
    }
}
