package com.project.gmaking.community.vo;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PostVO {
    private Long postId;
    private String title;
    private String content;
    private String userId;
    private String userNickname;
    private String categoryCode;
    private Long viewCount;
    private Long likeCount;
    private Long replyCount;
    private String isDeleted;

    private LocalDateTime createdDate;
    private String createdBy;
    private LocalDateTime updatedDate;
    private String updatedBy;
}