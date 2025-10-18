package com.project.gmaking.myPage.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RepresentativeCharacterVO {
    private String userId;
    private Integer characterId;
    private boolean hasCharacter;
}
