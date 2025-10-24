package com.project.gmaking.quest.controller;

import com.project.gmaking.quest.service.QuestService;
import com.project.gmaking.quest.vo.QuestRewardResponseVO;
import com.project.gmaking.quest.vo.UserQuestVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/quest")
public class QuestController {

    private final QuestService questService;

    /** 로그인 시 유저 퀘스트 조회 및 자동 생성 */
    @GetMapping("/daily")
    public List<UserQuestVO> getUserDailyQuests(@RequestParam String userId) {
        questService.initializeDailyQuests(userId);
        List<UserQuestVO> list = questService.getUserDailyQuests(userId);
        log.info("[퀘스트 조회 완료] userId={}, count={}", userId, list.size());
        return list;
    }

    /** 수동 보상 수령 요청 */
    @PostMapping("/reward")
    public ResponseEntity<QuestRewardResponseVO> rewardQuest(@RequestParam String userId, @RequestParam int questId) {
        QuestRewardResponseVO response = questService.rewardQuest(userId, questId);
        return ResponseEntity.ok(response);
    }
}
