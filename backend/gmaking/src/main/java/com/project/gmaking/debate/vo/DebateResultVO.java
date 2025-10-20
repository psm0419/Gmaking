// DebateResult.java
package com.project.gmaking.debate.vo;
import lombok.Builder;
import lombok.Data;
import java.util.*;

@Data @Builder
public class DebateResultVO {
    private String topic;
    private List<DebateLineVO> dialogue;     // 6개의 대사
    private Map<String,String> judgeVotes; // 예: {"gpt":"루루","gemini":"다크윈드","grok":"루루"}
    private Map<String,String> judgeComments;
    private String winner;                 // 최종 승자
}
