package com.project.gmaking.pve.vo;

import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
public class BattleLogVO {

    private Integer battleId;
    private Integer characterId;
    private String battleType;
    private Integer opponentId;
    private String isWin;
    private Long turnCount;

    private LocalDateTime createdDate;
    private String createdBy;
    private LocalDateTime updatedDate;
    private String updatedBy;

    // 프론트 표시용 (DB 비저장)
    private transient List<String> turnLogs;
    private String characterName;
    private String opponentName;

    // 기존 코드 호환용 생성자 (다른 서비스 로직에서 사용하는 형태)
    public BattleLogVO(Integer battleId,
                       Integer characterId,
                       String battleType,
                       Integer opponentId,
                       String isWin,
                       Long turnCount,
                       LocalDateTime createdDate,
                       String createdBy,
                       LocalDateTime updatedDate,
                       String updatedBy,
                       List<String> turnLogs) {
        this.battleId = battleId;
        this.characterId = characterId;
        this.battleType = battleType;
        this.opponentId = opponentId;
        this.isWin = isWin;
        this.turnCount = turnCount;
        this.createdDate = createdDate;
        this.createdBy = createdBy;
        this.updatedDate = updatedDate;
        this.updatedBy = updatedBy;
        this.turnLogs = turnLogs;
    }
}
