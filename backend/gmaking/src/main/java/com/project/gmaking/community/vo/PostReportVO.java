package com.project.gmaking.community.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PostReportVO {
    private Long reportId;

    // 신고 대상 정보
    private String targetType; // POST, COMMENT, USER 등
    private Long targetId;

    // 신고 내용
    private String reporterId; // 신고한 사용자 ID
    private String reasonCode; // SPAM, HATE_SPEECH, ETC 등
    private String reasonDetail; // 기타 사유 상세 내용

    // 신고 처리 정보
    private String status; // PENDING, REVIEWED, REJECTED 등

    // 감사(Auditing) 필드
    private String createdBy; // 최초 생성자 (신고자 ID)
    private LocalDateTime createdDate; // 최초 생성일시
    private String updatedBy; // 마지막 수정자 (처리 관리자 ID)
    private LocalDateTime updatedDate; // 마지막 수정일시
}
