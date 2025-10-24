package com.project.gmaking.community.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PostCharacterImageVO {
    private String userNickname;
    private String characterImageUrl;
    private Integer gradeId;
    private Integer totalStageClears;
}
