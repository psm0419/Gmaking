package com.project.gmaking.growth.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GrowthRequestVO {
    private String user_id;

    private Long character_id;

    private String target_modification;

    private Integer evolution_step;
}