package com.project.gmaking.community.vo;

import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
public class PostDetailDTO {
    private Long postId;
    private String title;
    private String content;
    private String userId;
    private String userNickname;

    private String categoryCode;
    private Long viewCount;
    private Long likeCount;
    private boolean isLiked;
    private String isDeleted;

    private LocalDateTime createdDate;
    private String createdBy;
    private LocalDateTime updatedDate;
    private String updatedBy;

    public PostDetailDTO(PostVO postVO){
        this.postId = postVO.getPostId();
        this.title = postVO.getTitle();
        this.content = postVO.getContent();
        this.userId = postVO.getUserId();
        this.userNickname = postVO.getUserNickname();
        this.categoryCode = postVO.getCategoryCode();
        this.viewCount = postVO.getViewCount();
        this.likeCount = postVO.getLikeCount();
        this.isDeleted = postVO.getIsDeleted();

        this.createdDate = postVO.getCreatedDate();
        this.createdBy = postVO.getCreatedBy();
        this.updatedDate = postVO.getUpdatedDate();
        this.updatedBy = postVO.getUpdatedBy();
    }
    public void setIsLiked(boolean isLiked) {
        this.isLiked = isLiked;
    }
}