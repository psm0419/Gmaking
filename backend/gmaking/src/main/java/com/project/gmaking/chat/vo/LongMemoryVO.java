package com.project.gmaking.chat.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class LongMemoryVO {
    private Integer memoryId;
    private String userId;
    private Integer characterId;

    // 호환용 (있어도 되고 비워도 됨)
    private String type;

    // 슬롯 키
    private String category;     // FAVORITE|DISLIKE|SCHEDULE|OTHER
    private String subject;      // 원본 표기
    private String subjectNorm;  // 정규화 키

    // 내용
    private String value;
    private Integer strength;    // 1~5
    private Double confidence;   // 0~1
    private String source;       // pipeline|runtime|admin

    // 일정 전용
    private LocalDateTime dueAt;
    private String metaJson;     // JSON 문자열 그대로 보관

    // 메타
    private LocalDateTime lastUsedAt;
    private LocalDateTime firstSeenAt;
    private Integer sourceConvId;
    private String updatedBy;
    private LocalDateTime updatedDate;
}
