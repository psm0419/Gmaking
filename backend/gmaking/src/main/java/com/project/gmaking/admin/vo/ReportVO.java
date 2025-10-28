package com.project.gmaking.admin.vo;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ReportVO {
    private Long reportId;              // report_id
    private String targetType;          // target_type (POST, COMMENT, USER)
    private Long targetId;              // target_id
    private String reporterId;            // reporter_id (신고한 사용자 ID - bigint)
    private String reasonCode;          // reason_code (SPAM, PORNOGRAPHY 등)
    private String reasonDetail;        // reason_detail
    private String status;              // status (PENDING, REVIEWED 등)
    private String createdBy;             // created_by (신고한 사용자 ID)
    private LocalDateTime createdDate;  // created_date (신고 접수일시)
    private String updatedBy;             // updated_by (처리 관리자 ID)
    private LocalDateTime updatedDate;  // updated_date (처리일시)

    // 조인 정보
    private String targetUserId;        // 신고 대상의 작성자 ID
    private String reporterNickname;    // 신고자 닉네임 (tb_user 조인)
    private String processorNickname;   // 처리자(관리자) 닉네임 (tb_user 조인)
    private Long navigationId;
}