package com.project.gmaking.myPage.vo;

import lombok.*;

import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MyPageSummaryVO {
    private MyPageProfileVO profile;
    private int characterCount;
    private List<CharacterCardVO> characters;
}
