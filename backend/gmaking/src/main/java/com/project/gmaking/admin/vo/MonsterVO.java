package com.project.gmaking.admin.vo;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class MonsterVO {
    // tb_monster Fields
    private Integer monsterId;              // MONSTER_ID (AI Key)
    private Integer imageId;                // IMAGE_ID (tb_image FK)
    private String monsterName;             // MONSTER_NAME
    private String monsterType;             // MONSTER_TYPE (NORMAL, BOSS)
    private Integer monsterHp;              // MONSTER_HP
    private Integer monsterAttack;          // MONSTER_ATTACK
    private Integer monsterDefense;         // MONSTER_DEFENSE
    private Integer monsterSpeed;           // MONSTER_SPEED
    private Integer monsterCriticalRate;    // MONSTER_CRITICAL_RATE

    // tb_image Fields (JOIN 조회 시 사용)
    private String imageUrl;                // 이미지 URL
    private String imageOriginalName;       // 원본 이미지 이름
    private String imageName;               // 서버 저장 이미지 이름

    // Common Fields
    private LocalDateTime createdDate;
    private String createdBy;
    private LocalDateTime updatedDate;
    private String updatedBy;
}