package com.project.gmaking.chat.job;

import com.project.gmaking.chat.service.ConversationCleanupService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class MidnightConversationCleaner {

    private static final int BATCH_SIZE = 500;

    private final ConversationCleanupService cleanupService;

    // 기존: @Scheduled(cron = "0 0 0 * * *", zone = "Asia/Seoul")
    @Scheduled(cron = "0 52 11 * * *", zone = "Asia/Seoul")
    public void run() {
        log.info("[Cleaner] start");

        int cleaned = cleanupService.cleanClosedConversationsBatch(BATCH_SIZE);
        log.info("[Cleaner] closed cleaned={}", cleaned);

        int updated = cleanupService.markOpenForDelay();
        log.info("[Cleaner] open marked delay_log_clean=1 -> {}", updated);

        log.info("[Cleaner] done");
    }
}
