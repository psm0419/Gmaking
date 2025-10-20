// DebateLine.java
package com.project.gmaking.debate.vo;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data @AllArgsConstructor
public class DebateLineVO {
    private String speaker; // 캐릭터명
    private String line;    // 발언
}
