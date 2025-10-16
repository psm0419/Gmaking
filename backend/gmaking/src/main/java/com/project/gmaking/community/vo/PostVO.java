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
    private String authorId;

    private List<Long> imageIds;

    private LocalDateTime createdDate;
    private LocalDateTime updatedDate;
}

