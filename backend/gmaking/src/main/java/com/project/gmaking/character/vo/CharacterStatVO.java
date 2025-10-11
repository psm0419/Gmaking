package com.project.gmaking.character.vo;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Data // Getter, Setter, ToString, EqualsAndHashCode 등을 자동 생성
@NoArgsConstructor // 기본 생성자 자동 생성
@AllArgsConstructor // 모든 필드를 인자로 받는 생성자 자동 생성
public class CharacterStatVO {

    private Integer characterId; // 캐릭터 ID (Integer)
    private Integer characterHp; // 캐릭터 체력 (Integer)
    private Integer characterAttack; // 캐릭터 공격력 (Integer)
    private Integer characterDefense; // 캐릭터 방어력 (Integer)
    private Integer characterSpeed; // 캐릭터 속도 (Integer)
    private Integer criticalRate; // 크리티컬 확률 (Integer)

    private LocalDateTime createdDate; // 생성 일자 (DATETIME)
    private String createdBy; // 생성자 (VARCHAR(50))
    private LocalDateTime updatedDate; // 수정 일자 (DATETIME)
    private String updatedBy; // 수정자 (VARCHAR(50))
}