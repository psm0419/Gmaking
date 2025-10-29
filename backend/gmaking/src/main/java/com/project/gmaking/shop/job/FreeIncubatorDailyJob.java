package com.project.gmaking.shop.job;

import com.project.gmaking.shop.dao.FreeIncubatorSchedulerDAO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class FreeIncubatorDailyJob {

    private final FreeIncubatorSchedulerDAO dao;

    // 매일 06:00 KST 가 기본
    @Transactional
    @Scheduled(cron = "0 00 06 * * *", zone = "Asia/Seoul")
    public void grantDailyFreeIncubator() {
        Integer lock = null;
        try {
            lock = dao.acquireDailyLock();
            if (lock == null || lock == 0) {
                log.info("[FreeIncubator] another instance holds the lock. skip.");
                return;
            }

            int up = dao.grantDailyFreeToAllUsers();
            int ref = dao.refreshIncubatorCacheForAllUsers();
            log.info("[FreeIncubator] granted(upsert)={}, cacheRefreshed={}", up, ref);
        } finally {
            if (lock != null && lock == 1) {
                dao.releaseDailyLock();
            }
        }
    }
}
