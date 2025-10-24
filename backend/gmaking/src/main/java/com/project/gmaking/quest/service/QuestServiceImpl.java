package com.project.gmaking.quest.service;

import com.project.gmaking.login.dao.LoginDAO;
import com.project.gmaking.login.vo.LoginVO;
import com.project.gmaking.quest.dao.InventoryDAO;
import com.project.gmaking.quest.dao.QuestDAO;
import com.project.gmaking.quest.vo.QuestRewardResponseVO;
import com.project.gmaking.quest.vo.QuestVO;
import com.project.gmaking.quest.vo.UserQuestVO;
import com.project.gmaking.security.JwtTokenProvider;
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
    private final LoginDAO loginDAO;
    private final JwtTokenProvider jwtTokenProvider;
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

        QuestVO quest = questDAO.findByType(questType);
        if (quest == null) return;

        UserQuestVO userQuest = questDAO.findByUserAndQuest(userId, quest.getQuestId());
        if (userQuest == null) return;

        // 목표 도달 시 COMPLETED로 변경 (자동 보상 지급 X)
        if (userQuest.getCurrentCount() >= quest.getTargetCount()
                && !"COMPLETED".equals(userQuest.getStatus())
                && !"REWARDED".equals(userQuest.getStatus())) {
            questDAO.updateStatus(userId, quest.getQuestId(), "COMPLETED");
            log.info("[퀘스트 완료] userId={}, questType={}, status=COMPLETED", userId, questType);
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
    public QuestRewardResponseVO rewardQuest(String userId, int questId) {
        UserQuestVO userQuest = questDAO.findByUserAndQuest(userId, questId);
        if (userQuest == null)
            throw new IllegalArgumentException("해당 퀘스트가 존재하지 않습니다.");
        if (!"COMPLETED".equals(userQuest.getStatus()))
            throw new IllegalStateException("아직 완료되지 않은 퀘스트입니다.");

        QuestVO quest = questDAO.findById(questId);
        if (quest == null)
            throw new IllegalArgumentException("퀘스트 정의를 찾을 수 없습니다.");

        // 1. 보상 지급 및 DB 갱신 (부화권 카운트 포함)
        giveReward(userId, quest);
        questDAO.updateStatus(userId, questId, "REWARDED");

        log.info("[보상 수령 완료] userId={}, questId={}, reward={}x{}",
                userId, questId, quest.getRewardProductId(), quest.getRewardQuantity());

        // 2. 갱신된 정보로 사용자 데이터 재조회
        LoginVO currentUser = loginDAO.selectUserById(userId);

        // 3. 새 JWT 토큰 생성 (AuthContext.js 에서 사용될 최신 정보 포함)
        String newToken = jwtTokenProvider.createToken(
                currentUser.getUserId(),
                currentUser.getRole(),
                currentUser.getUserNickname(),
                currentUser.isHasCharacter(),
                currentUser.getCharacterImageUrl(),
                currentUser.getIncubatorCount(),
                currentUser.isAdFree(),
                currentUser.getCharacterCount()
        );

        // 4. 응답 VO 반환
        return QuestRewardResponseVO.builder()
                .message("퀘스트 보상을 수령했습니다.")
                .newToken(newToken)
                .build();
    }

    /** 실제 보상 지급 로직 */
    @Transactional
    private void giveReward(String userId, QuestVO quest) {
        int productId = quest.getRewardProductId();
        int qty = quest.getRewardQuantity();

        int updated = inventoryDAO.addQuantity(userId, productId, qty);
        if (updated == 0) {
            inventoryDAO.insert(userId, productId, qty);
        }

        // TB_USER.INCUBATOR_COUNT 동기화
        inventoryDAO.refreshUserIncubatorCache(userId);

        log.info("[보상 지급 완료] userId={}, productId={}, qty={}", userId, productId, qty);
    }
}
