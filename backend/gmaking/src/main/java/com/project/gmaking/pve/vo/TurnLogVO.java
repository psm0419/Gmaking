package com.project.gmaking.pve.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor // 기본 생성자 자동 생성
@AllArgsConstructor // 모든 필드를 인자로 받는 생성자 자동 생성
public class TurnLogVO {
    private Integer turnLogId;
    private Integer battleId;
    private Integer turnNumber;
    private String actionDetail;
    private LocalDateTime createdDate;
}
