package com.project.gmaking.pve.vo;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;
import java.time.LocalDateTime;

@Data // Getter, Setter, ToString, EqualsAndHashCode 등을 자동 생성
@NoArgsConstructor // 기본 생성자 자동 생성
@AllArgsConstructor // 모든 필드를 인자로 받는 생성자 자동 생성
public class BattleLogVO {

    private Integer battleId; // 배틀 ID (Integer)
    private Integer characterId; // 캐릭터 ID (VARCHAR(50))
    private String battleType; // 전투 유형: PVE (VARCHAR(10))
    private Integer opponentId; // 상대방 ID Integer)
    private String isWin; // 승리 여부: Y: 승리, N: 패배 (CHAR(1))
    private Long turnCount; // 최종 턴 수 (BIGINT -> Long)

    private LocalDateTime createdDate; // 생성 일자 (DATETIME)
    private String createdBy; // 생성자 (VARCHAR(50))
    private LocalDateTime updatedDate; // 수정 일자 (DATETIME)
    private String updatedBy; // 수정자 (VARCHAR(50))

    // 프론트 표시용 턴 로그 (DB 비저장)
    private transient List<String> turnLogs;

}
