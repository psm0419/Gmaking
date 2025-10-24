package com.project.gmaking.character.vo;

import lombok.Builder;
import lombok.Data;

@Data
@Builder(toBuilder = true)
public class CharacterGenerateResponseVO {
    private Integer characterId;        // 생성된 캐릭터의 ID (PK)
    private String characterName;       // 생성된 캐릭터 이름
    private String imageUrl;            // GCS에 저장된 최종 이미지 URL
    private String predictedAnimal;     // 분류된 동물 이름 (참고용)
    private String newToken;
    private String errorMessage;
}