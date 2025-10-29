package com.project.gmaking.chat.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EnterResponseVO {
    private Integer personaId;   // 생성되었거나 기존의 페르소나 Id
    private Integer conversationId;
    private String greetingMessage; // 첫인사 메세지 (첫 입장일 때만)
    private Boolean isFirstMeet; // true면 첫인사 단계
    private List<DialogueVO> history; // 기존대화 기록
}
