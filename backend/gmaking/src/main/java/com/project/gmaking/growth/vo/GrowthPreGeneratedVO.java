package com.project.gmaking.growth.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GrowthPreGeneratedVO {
    private Integer preGenId;             // PRE_GEN_ID
    private Integer characterId;          // CHARACTER_ID
    private String userId;                // USER_ID
    private Integer currentEvolutionStep; // CURRENT_EVOLUTION_STEP
    private Integer nextEvolutionStep;    // NEXT_EVOLUTION_STEP
    private Integer imageId;              // IMAGE_ID
    private String imageUrl;              // IMAGE_URL
    private LocalDateTime createdDate;    // CREATED_DATE
    private String createdBy;             // CREATED_BY
    private LocalDateTime updatedDate;    // UPDATED_DATE
    private String updatedBy;             // UPDATED_BY
}
