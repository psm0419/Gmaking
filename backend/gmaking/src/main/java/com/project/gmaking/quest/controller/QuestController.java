package com.project.gmaking.quest.controller;

import com.project.gmaking.quest.service.QuestService;
import com.project.gmaking.quest.vo.UserQuestVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/quest")
public class QuestController {

    private final QuestService questService;

    /**
     * 로그인 시 유저의 일일 퀘스트 초기화 및 조회
     */
    @GetMapping("/daily")
    public List<UserQuestVO> getUserDailyQuests(@RequestParam String userId) {
        log.info("[퀘스트 조회] userId={}", userId);

        // 유저의 퀘스트 초기화 (없는 퀘스트는 생성)
        questService.initializeDailyQuests(userId);

        // 퀘스트 목록 조회
        List<UserQuestVO> quests = questService.getUserDailyQuests(userId);
        log.info("[퀘스트 조회 완료] userId={}, count={}", userId, quests.size());

        return quests;
    }

    /**
     * 보상 수령 요청
     */
    @PostMapping("/reward")
    public String receiveReward(
            @RequestParam String userId,
            @RequestParam int questId
    ) {
        log.info("[보상 수령 요청] userId={}, questId={}", userId, questId);
        questService.rewardQuest(userId, questId);
        return "보상 수령 완료";
    }
}
