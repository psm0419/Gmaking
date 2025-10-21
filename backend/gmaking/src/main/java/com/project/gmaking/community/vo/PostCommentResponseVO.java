package com.project.gmaking.community.vo;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PostCommentResponseVO {
    private Long commentId;
    private Long postId;

    private Long parentId;
    private int commentDepth;

    private String userId;
    private String userNickname;

    private String content;
    private LocalDateTime createdDate;
    private LocalDateTime updatedDate;

    private boolean isDeleted;
}
