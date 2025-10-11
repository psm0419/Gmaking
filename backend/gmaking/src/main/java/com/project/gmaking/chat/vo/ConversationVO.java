package com.project.gmaking.chat.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversationVO {
    private Integer conversationId;  // 대화창 id
    private String userId;  // 유저 아이디
    private Integer characterId; // 캐릭터 id
    private LocalDateTime createdDate; //created_date
    private String createdBy; // created_by
    private LocalDateTime updateDate;  // UPDATED_DATE
    private String updateBy; // UPDATE_BY
}
