package com.project.gmaking.quest.scheduler;

import com.project.gmaking.quest.service.QuestService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Slf4j
@Component
@RequiredArgsConstructor
public class QuestRestScheduler {

    private final QuestService questService;

    /**
     * 매일 자정(00:00)에 모든 유저 퀘스트 초기화
     */
    @Scheduled(cron = "0 0 0 * * *")  // 매일 00시 실행
    public void resetDailyQuests() {
        log.info("[퀘스트 리셋] 일일 퀘스트 초기화 시작: {}", LocalDate.now());
        questService.resetDailyQuests();
        log.info("[퀘스트 리셋] 완료");
    }
}
