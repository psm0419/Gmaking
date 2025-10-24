package com.project.gmaking.quest.vo;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class QuestRewardResponseVO {
    private String message;
    private String newToken;
}