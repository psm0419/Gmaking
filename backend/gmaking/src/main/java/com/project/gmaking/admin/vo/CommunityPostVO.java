package com.project.gmaking.admin.vo;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CommunityPostVO {
    private Long postId;                // POST_ID
    private String userId;              // USER_ID
    private String categoryCode;        // CATEGORY_CODE
    private String title;               // TITLE
    private String content;             // CONTENT
    private Integer viewCount;          // VIEW_COUNT
    private Integer likeCount;          // LIKE_COUNT
    private String isDeleted;           // IS_DELETED (Y/N)
    private LocalDateTime createdDate;  // CREATED_DATE
    private String createdBy;           // CREATED_BY
    private LocalDateTime updatedDate;  // UPDATED_DATE
    private String updatedBy;           // UPDATED_BY

    // 조인 정보
    private String userNickname;        // tb_user.USER_NICKNAME (작성자 닉네임)
    private Integer commentCount;       // tb_community_comment (댓글 수)
}