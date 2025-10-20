package com.project.gmaking.community.vo;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;
// import java.util.List; // List를 사용하지 않으므로 제거

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
    private String isDeleted;

    private LocalDateTime createdDate;
    private String createdBy;
    private LocalDateTime updatedDate;
    private String updatedBy;
}