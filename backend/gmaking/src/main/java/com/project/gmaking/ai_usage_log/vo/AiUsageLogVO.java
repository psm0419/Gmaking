package com.project.gmaking.ai_usage_log.vo;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class AiUsageLogVO {
    private Integer usageLogId;
    private Integer userId;
    private String featureType;
    private String modelName;
    private Integer inputToken;
    private Integer outputToken;
    private Integer totalCost;
    private Integer requestCount;
    private String usageStatus;
    private String errorMessage;
    private LocalDate logDate;
    private LocalDateTime createAt;
}
