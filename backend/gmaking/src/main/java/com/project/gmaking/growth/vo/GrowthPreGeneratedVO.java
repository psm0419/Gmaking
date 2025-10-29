package com.project.gmaking.growth.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GrowthPreGeneratedVO {
    private Integer preGenId;
    private Long characterId;
    private String userId;
    private Integer currentEvolutionStep;
    private Integer nextEvolutionStep;
    private Long imageId;
    private String imageUrl;
    private LocalDateTime createdDate;
    private String createdBy;
    private LocalDateTime updatedDate;
    private String updatedBy;

    private String usedYn; // 추가: 이미지 사용 여부 (Y/N)
}

