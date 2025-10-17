package com.project.gmaking.community.vo;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PostVO {
    private Long postId;
    private String title;
    private String content;
    private String userId;

    private List<Long> imageIds;
    private String categoryCode;
    private Long viewCount;
    private Long likeCount;
    private String isDeleted;

    private LocalDateTime createdDate;
    private String createdBy;
    private LocalDateTime updatedDate;
    private String updatedBy;
}

