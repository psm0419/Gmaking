package com.project.gmaking.myPage.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MypageCharacterStatVO {
    private Integer hp;
    private Integer attack;
    private Integer defense;
    private Integer speed;
    private Integer criticalRate;
}
