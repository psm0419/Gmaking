package com.project.gmaking.admin.vo;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CharacterVO {
    private Integer characterId;            // CHARACTER_ID (tb_character)
    private String userId;                  // USER_ID (tb_character)
    private Integer imageId;                // IMAGE_ID (tb_character)
    private Integer characterPersonalityId; // CHARACTER_PERSONALITY_ID
    private String characterName;           // CHARACTER_NAME
    private String backgroundInfo;          // BACKGROUND_INFO
    private Integer gradeId;                // GRADE_ID
    private Integer totalStageClears;       // TOTAL_STAGE_CLEARS
    private Integer evolutionStep;          // EVOLUTION_STEP
    private LocalDateTime createdDate;      // CREATED_DATE

    // 조인 정보
    private String imageUrl;                // IMAGE_URL (tb_image)
    private String userNickname;            // USER_NICKNAME (tb_user)
}