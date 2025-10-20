package com.project.gmaking.community.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PostLikeVO {
    // 좋아요를 누른 사용자 ID
    private Long likeId;

    // 좋아요를 받은 게시글 ID
    private String userId;

    private Long postId;
    private LocalDateTime createdDate;

    public PostLikeVO(String userId, Long postId) {
        this.userId = userId;
        this.postId = postId;
    }
}
