package com.project.gmaking.quest.vo;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class UserQuestVO {
    private Integer userQuestId;         // 유저 퀘스트 진행 ID
    private String userId;               // 유저 ID
    private Integer questId;             // 퀘스트 ID
    private Integer currentCount;        // 현재 진행 횟수
    private String status;               // 상태 (IN_PROGRESS, COMPLETED, REWARDED)
    private LocalDateTime startedAt;     // 시작 시각
    private LocalDateTime completedAt;   // 완료 시각
    private LocalDate lastResetDate;     // 마지막 초기화 일자

    // JOIN 시 포함될 정보
    private String questName;
    private Integer targetCount;
    private String questType;
}
