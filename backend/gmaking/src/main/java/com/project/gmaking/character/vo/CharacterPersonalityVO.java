package com.project.gmaking.character.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CharacterPersonalityVO {
    private Integer characterPersonalityId; // CHARACTER_PERSONALITY_ID
    private String personalityDescription;  // PERSONALITY_DESCRIPTION
    private LocalDateTime createdDate;      // CREATED_DATE
    private String createdBy;               // CREATED_BY
    private LocalDateTime updatedDate;      // UPDATED_DATE
    private String updatedBy;               // UPDATED_BY
}
