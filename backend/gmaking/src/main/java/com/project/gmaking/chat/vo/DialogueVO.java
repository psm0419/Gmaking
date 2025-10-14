package com.project.gmaking.chat.vo;

import com.project.gmaking.chat.constant.DialogueSender;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DialogueVO {
    private Integer messageId;      // MESSAGE_ID
    private Integer conversationId; // CONVERSATION_ID

    private DialogueSender sender;          // 'user' | 'character'
    private String content;         // CONTENT
    private LocalDate chatDate;     // CHAT_DATE

    private LocalDateTime createdDate; // CREATED_DATE
    private String createdBy;          // CREATED_BY
    private LocalDateTime updatedDate; // UPDATED_DATE
    private String updatedBy;          // UPDATED_BY
}
