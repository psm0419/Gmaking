package com.project.gmaking.notification.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * PVP 결과 모달용 VO
 * - TB_NOTIFICATION + TB_PVP_BATTLE + 캐릭터 정보 조합 결과
 * - metaJson 없이 DB 조인으로 채워짐
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PvpResultModalVO {

    private Integer notificationId;    // 알림 ID
    private Integer battleId;           // 배틀 ID

    private String result;              // WIN / LOSE
    private String opponentUserId;      // 상대 유저 ID
    private String opponentNickname;    // 상대 닉네임
    private Integer opponentCharacterId;// 상대 캐릭터 ID
    private String opponentCharacterName;// 상대 캐릭터 이름
    private String opponentImageUrl;    // 상대 캐릭터 이미지 URL

    private Integer gradeId;

    private Integer hp;                 // HP
    private Integer atk;                // 공격력
    private Integer def;                // 방어력
    private Integer spd;                // 속도
    private Integer crit;               // 치명타율
}
