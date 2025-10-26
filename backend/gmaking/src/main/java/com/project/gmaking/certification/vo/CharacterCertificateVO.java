package com.project.gmaking.certification.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CharacterCertificateVO {
    private String  userNickname;           // tb_user.USER_NICKNAME
    private Integer characterId;            // tb_character.CHARACTER_ID
    private String  characterName;          // tb_character.CHARACTER_NAME
    private Integer gradeId;                // tb_character.GRADE_ID
    private String  backgroundInfo;         // tb_character.BACKGROUND_INFO
    private Integer evolutionStep;          // tb_character.EVOLUTION_STEP
    private Integer totalStageClears;       // tb_character.TOTAL_STAGE_CLEARS
    private Integer imageId;                // tb_character.IMAGE_ID (URL 변환은 선택)

    // stats
    private Integer hp;                     // tb_character_stat.CHARACTER_HP
    private Integer attack;                 // tb_character_stat.CHARACTER_ATTACK
    private Integer defense;                // tb_character_stat.CHARACTER_DEFENSE
    private Integer speed;                  // tb_character_stat.CHARACTER_SPEED
    private Integer criticalRate;           // tb_character_stat.CRITICAL_RATE

    // personality
    private String  personality;            // tb_character_personality.PERSONALITY_DESCRIPTION

    // counts
    private Long    pveCount;               // tb_battle_log: BATTLE_TYPE='PVE'
    private Long    pvpCount;               // tb_battle_log: BATTLE_TYPE='PVP'
}
