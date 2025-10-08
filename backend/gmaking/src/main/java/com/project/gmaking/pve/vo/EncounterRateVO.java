package com.project.gmaking.pve.vo;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Data // Getter, Setter, ToString, EqualsAndHashCode 등을 자동 생성
@NoArgsConstructor // 기본 생성자 자동 생성
@AllArgsConstructor // 모든 필드를 인자로 받는 생성자 자동 생성
public class EncounterRateVO {
    private String encounterType; // NORMAL / BOSS
    private Double encounterRate; // 확률 (%)
    private String description;
    private LocalDateTime updatedDate;
}
