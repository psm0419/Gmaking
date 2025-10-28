package com.project.gmaking.pve.vo;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Data // Getter, Setter, ToString, EqualsAndHashCode 등을 자동 생성
@NoArgsConstructor // 기본 생성자 자동 생성
@AllArgsConstructor // 모든 필드를 인자로 받는 생성자 자동 생성
@JsonIgnoreProperties(ignoreUnknown = true)
public class MonsterVO {

    private Integer monsterId; // 몬스터 ID (Integer)
    private Integer imageId; // 이미지 ID (Integer)
    private String imageUrl;
    private String imageOriginalName;
    private String monsterName; // 몬스터 이름 (VARCHAR(100))
    private String monsterType; // 몬스터 유형 (VARCHAR(20))
    private Integer monsterHp; // 몬스터 체력 (Integer)
    private Integer monsterAttack; // 몬스터 공격력 (Integer)
    private Integer monsterDefense; // 몬스터 방어력 (Integer)
    private Integer monsterSpeed; // 몬스터 스피드 (Integer)
    private Integer monsterCriticalRate; // 몬스터 크리티컬 확률 (Integer, Nullable)
    private LocalDateTime createdDate; // 생성 일자 (DATETIME)
    private String createdBy; // 생성자 (VARCHAR(50))
    private LocalDateTime updatedDate; // 수정 일자 (DATETIME)
    private String updatedBy; // 수정자 (VARCHAR(50))
}
