package com.project.gmaking.shop.service;

import com.project.gmaking.shop.dao.FreeIncubatorSchedulerDAO;
import lombok.RequiredArgsConstructor;
import lombok.Value;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class FreeIncubatorGrantService {
    private final FreeIncubatorSchedulerDAO dao;

    @Value
    public static class GrantResult {
        int grantedUpserts;
        int cacheUpdatedRows;
        boolean executed;
    }

    @Transactional
    public GrantResult runDailyGrantWithLock() {
        Integer lock = null;
        try {
            lock = dao.acquireDailyLock();
            if (lock == null || lock == 0) {
                log.info("[FreeIncubator] lock not acquired. skip.");
                return new GrantResult(0, 0, false);
            }
            int up = dao.grantDailyFreeToAllUsers();
            int ref = dao.refreshIncubatorCacheForAllUsers();
            log.info("[FreeIncubator] granted(upsert)={}, cacheRefreshed={}", up, ref);
            return new GrantResult(up, ref, true);
        } finally {
            if (lock != null && lock == 1) {
                dao.releaseDailyLock();
            }
        }
    }

    @Transactional
    public GrantResult runDailyGrantNoLock() {
        int up = dao.grantDailyFreeToAllUsers();
        int ref = dao.refreshIncubatorCacheForAllUsers();
        return new GrantResult(up, ref, true);
    }


}
