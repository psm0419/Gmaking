package com.project.gmaking.notice.vo;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class NoticeVO {
    private Integer noticeId;
    private String noticeTitle;
    private String noticeContent;
    private Integer noticeViewCount;
    private Boolean isPinned;
    private String createdBy;
    private LocalDateTime createdDate;
    private String lastModifiedBy;
    private LocalDateTime lastModifiedDate;
}