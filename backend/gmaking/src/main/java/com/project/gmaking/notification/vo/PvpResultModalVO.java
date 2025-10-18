package com.project.gmaking.notification.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PvpResultModalVO {
    private Integer notificationId;
    private Integer battleId;

    private String result;
    private String opponentUserId;
    private String opponentNickname;
    private Integer opponentCharacterId;
    private String opponentCharacterName;
    private String opponentImageUrl;

    private Integer level;
    private Integer hp;
    private Integer atk;
    private Integer def;
    private Integer spd;
    private Integer crit;
}
