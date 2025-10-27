package com.project.gmaking.admin.vo;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class MonsterVO {
    private int monsterId;                  // MONSTER_ID
    private String imagePath;               // 몬스터 이미지 파일 경로
    private String monsterName;             // MONSTER_NAME
    private String monsterType;             // MONSTER_TYPE (NORMAL, BOSS)
    private int monsterHp;                  // MONSTER_HP
    private int monsterAttack;              // MONSTER_ATTACK
    private int monsterDefense;             // MONSTER_DEFENSE
    private int monsterSpeed;               // MONSTER_SPEED
    private Integer monsterCriticalRate;    // MONSTER_CRITICAL_RATE

    // 공통 필드
    private LocalDateTime createdDate;      // CREATED_DATE
    private String createdBy;               // CREATED_BY
    private LocalDateTime updatedDate;      // UPDATED_DATE
    private String updatedBy;               // UPDATED_BY
}