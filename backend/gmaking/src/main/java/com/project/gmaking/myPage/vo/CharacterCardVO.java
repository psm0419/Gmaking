package com.project.gmaking.myPage.vo;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CharacterCardVO {
    private Integer characterId;
    private String name;
    private Integer evolutionStep;
    private String imageUrl;
    private String grade;
}
