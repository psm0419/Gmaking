package com.project.gmaking.map.vo;
import lombok.Data;
import java.time.LocalDateTime;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data // Getter, Setter, ToString, EqualsAndHashCode 등을 자동 생성
@NoArgsConstructor // 기본 생성자 자동 생성
@AllArgsConstructor // 모든 필드를 인자로 받는 생성자 자동 생성
public class MapVO {
    private Integer mapId;
    private String mapName;
    private String mapImageUrl;
    private LocalDateTime createdDate;
    private String createdBy;
    private LocalDateTime updatedDate;
    private String updatedBy;
}
