package com.project.gmaking.character.vo;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Data // Getter, Setter, ToString, EqualsAndHashCode 등을 자동 생성
@NoArgsConstructor // 기본 생성자 자동 생성
@AllArgsConstructor // 모든 필드를 인자로 받는 생성자 자동 생성
public class CharacterVO {

    private Integer characterId; // 캐릭터 ID (CHARACTER_ID)
    private String userId; // 사용자 ID (USER_ID)
    private Long imageId; // 캐릭터 이미지 ID (IMAGE_ID)
    private Integer characterPersonalityId; // 캐릭터 성격 ID (CHARACTER_PERSONALITY_ID)
    private String imageUrl;
    private String characterName; // 캐릭터 이름 (CHARACTER_NAME)
    private String backgroundInfo; // 배경 정보 (BACKGROUND_INFO)
    private Integer gradeId; // 캐릭터 등급 (GRADE_ID)
    private Integer totalStageClears; // 총 클리어 횟수 (TOTAL_STAGE_CLEARS)
    private Integer evolutionStep; // 현재 진화 단계 (EVOLUTION_STEP)

    private LocalDateTime createdDate; // 생성 일자 (CREATED_DATE)
    private String createdBy; // 생성자 (CREATED_BY)
    private LocalDateTime updatedDate; // 수정 일자 (UPDATED_DATE)
    private String updatedBy; // 수정자 (UPDATED_BY)

    private CharacterStatVO characterStat;
}