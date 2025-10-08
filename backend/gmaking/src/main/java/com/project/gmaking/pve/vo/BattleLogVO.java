package com.project.gmaking.pve.vo;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Data // Getter, Setter, ToString, EqualsAndHashCode 등을 자동 생성
@NoArgsConstructor // 기본 생성자 자동 생성
@AllArgsConstructor // 모든 필드를 인자로 받는 생성자 자동 생성
public class BattleLogVO {

    private String battleId; // 배틀 ID (VARCHAR(50))
    private String characterId; // 캐릭터 ID (VARCHAR(50))
    private String battleType; // 전투 유형: PVE (VARCHAR(10))
    private String opponentId; // 상대방 ID (VARCHAR(50))
    private String isWin; // 승리 여부: Y: 승리, N: 패배 (CHAR(1))
    private Long turnCount; // 최종 턴 수 (BIGINT -> Long)

    private LocalDateTime createdDate; // 생성 일자 (DATETIME)
    private String createdBy; // 생성자 (VARCHAR(50))
    private LocalDateTime updatedDate; // 수정 일자 (DATETIME)
    private String updatedBy; // 수정자 (VARCHAR(50))
}
