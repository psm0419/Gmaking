package com.project.gmaking.aiLog.vo;

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
public class AiUsageLogVO {
    private Integer usageLogId;     // usage_log_id
    private String  userId;         // user_id
    private String  featureType;    // feature_type (예: chat, image, summarize 등)
    private String  modelName;      // model_name
    private Integer inputToken;     // input_token
    private Integer outputToken;    // output_token
    private Integer totalCost;      // total_cost (정수로 관리, 센트 단위 등)
    private Integer requestCount;   // request_count
    private String  usageStatus;    // success / quota_exceeded / error
    private String  errorMessage;   // error_message
    private LocalDate logDate;      // log_date
    private LocalDateTime createdDate; // created_date
    private String  createdBy;      // created_by
    private LocalDateTime updatedDate; // updated_date
    private String  updatedBy;      // updated_by
}
