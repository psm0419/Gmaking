package com.project.gmaking.pve.vo;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Data // Getter, Setter, ToString, EqualsAndHashCode 등을 자동 생성
@NoArgsConstructor // 기본 생성자 자동 생성
@AllArgsConstructor // 모든 필드를 인자로 받는 생성자 자동 생성
public class CharacterStatVO {

    private String characterId; // 캐릭터 ID (VARCHAR(50))
    private Integer characterHp; // 캐릭터 체력 (INT -> Integer)
    private Integer characterAttack; // 캐릭터 공격력 (INT -> Integer)
    private Integer characterDefense; // 캐릭터 방어력 (INT -> Integer)
    private Integer characterSpeed; // 캐릭터 속도 (INT -> Integer)
    private Integer criticalRate; // 크리티컬 확률 (INT -> Integer)

    private LocalDateTime createdDate; // 생성 일자 (DATETIME)
    private String createdBy; // 생성자 (VARCHAR(50))
    private LocalDateTime updatedDate; // 수정 일자 (DATETIME)
    private String updatedBy; // 수정자 (VARCHAR(50))
}