package com.project.gmaking.dialogue.vo;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class DialogueVO {
    private Integer messageId;
    private Integer conversationId;
    private String sender;
    private String content;
    private LocalDate chatDate;
    private LocalDateTime createAt;
}
