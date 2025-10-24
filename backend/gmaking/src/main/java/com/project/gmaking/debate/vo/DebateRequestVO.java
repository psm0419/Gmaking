// DebateRequest.java
package com.project.gmaking.debate.vo;
import lombok.Data;

@Data
public class DebateRequestVO {
    private String userId;
    private Integer characterAId;
    private Integer characterBId;
    private String topic;       // 없으면 서버에서 기본 주제 생성
    private int turnsPerSide = 3; // 고정 3턴
}
