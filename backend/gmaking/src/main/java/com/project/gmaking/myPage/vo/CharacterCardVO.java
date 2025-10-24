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
    private Integer imageId;
    private String imageUrl;
    private String grade;

    private Integer stageClearCount;

    private MypageCharacterStatVO characterStatVO;
}
