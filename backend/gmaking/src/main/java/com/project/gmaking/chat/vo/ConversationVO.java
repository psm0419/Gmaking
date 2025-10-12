package com.project.gmaking.chat.vo;

import com.project.gmaking.chat.constant.ConversationStatus;
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

    private ConversationStatus status; // OPEN | CLOSED
    private Boolean isFirstMeet;  // true = 첫인사 단계
    private String callingName; // null 이면 마스터
    private Boolean delayLogClean;  // 자정 지연 삭제 플래그

    private LocalDateTime createdDate; //created_date
    private String createdBy; // created_by
    private LocalDateTime updatedDate;  // UPDATED_DATE
    private String updatedBy; // UPDATE_BY
}
