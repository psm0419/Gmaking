package com.project.gmaking.growth.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GrowthRequestVO {
    private String userId;
    private Long characterId;
    private String targetModification;
}
