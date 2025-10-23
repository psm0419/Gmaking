package com.project.gmaking.growth.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GrowthResponseVO {
    // 1. AI 처리 결과
    private String status;
    private String imageBase64; // AI가 생성한 Base64 인코딩된 이미지 데이터 (PNG)
    private String imageFormat; // "png"

    // 2. 캐릭터 및 진화 정보 (DB 업데이트에 사용)
    private String userId;
    private Long characterId;
    private Integer newEvolutionStep; // 캐릭터가 도달할 다음 진화 단계

    // 3. 스탯 정보
    private Integer totalStageClearCount;

    // 최종 스탯 (Java 백엔드가 클라이언트에게 반환할 때 사용)
    private Double newTotalAttack;
    private Double newTotalDefense;
    private Double newTotalHp;
    private Double newTotalSpeed;
    private Double newTotalCriticalRate;

    // 증가분 (이미 Python에서 tb_growth에 기록됨, 결과 확인용)
    private Integer incrementAttack;
    private Integer incrementDefense;
    private Integer incrementHp;
    private Integer incrementSpeed;
    private Integer incrementCriticalRate;
}
