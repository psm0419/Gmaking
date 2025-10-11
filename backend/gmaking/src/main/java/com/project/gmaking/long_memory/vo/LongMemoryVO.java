package com.project.gmaking.long_memory.vo;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class LongMemoryVO {
    private Integer memoryId;
    private Integer conversationId;
    private LocalDate memoryDate;
    private String summary;
    private LocalDateTime createdAt;
}
