package com.project.gmaking.growth.scheduler;

import com.project.gmaking.growth.service.GrowthPreGeneratedService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class GrowthPreGeneratedScheduler {

    private final GrowthPreGeneratedService preGenService;

    /** 매일 새벽 3시 실행 */
    @Scheduled(cron = "0 0 3 * * *", zone = "Asia/Seoul")
    public void runPreGeneration() {
        log.info("[스케줄러] 캐릭터 사전 성장 이미지 생성 시작");

        List<Long> targetIds = preGenService.getEligibleCharacters(); // ✅ 타입 통일
        if (targetIds == null || targetIds.isEmpty()) {
            log.info("사전 생성 대상 없음, 종료");
            return;
        }

        for (Long characterId : targetIds) { // ✅ Long 타입으로 반복
            preGenService.generatePreGrowthForCharacter(characterId);

            // AI 서버 과부하 방지용 잠깐 대기
            try { Thread.sleep(1500); } catch (InterruptedException ignored) {}
        }

        log.info("[스케줄러] 캐릭터 사전 생성 완료. 총 {}건 처리", targetIds.size());
    }
}
