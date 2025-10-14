package com.project.gmaking.chat.vo;

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
public class ConversationSummaryVO {
    private Integer conversationId;
    private String  rollingSummary;
    private Integer summaryVersion;

    private Integer lastTurnId;
    private Integer lengthChars;
    private String updatedBy;
    private LocalDateTime updatedDate;
}
