package com.project.gmaking.quest.vo;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class QuestVO {
    private Integer questId;             // 퀘스트 ID
    private String questName;            // 퀘스트 이름
    private String questType;            // 퀘스트 타입 (PVE, PVP, DEBATE, MINIGAME)
    private Integer targetCount;         // 목표 횟수
    private Integer rewardProductId;     // 보상 상품 ID (ex: 부화권)
    private Integer rewardQuantity;      // 보상 수량
    private String questCycle;           // 퀘스트 주기 (DAILY, WEEKLY)
    private String isRepeatable;         // 반복 가능 여부 (Y/N)
    private LocalDateTime createdAt;     // 등록 시각
}
