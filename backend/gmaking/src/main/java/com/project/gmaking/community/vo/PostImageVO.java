package com.project.gmaking.community.vo;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PostImageVO {
    private Long imageId;
    private String imageOriginalName;
    private String imageUrl;
    private String imageName;
    private long imageType;
    private LocalDateTime createdDate;
    private String createdBy;
    private LocalDateTime updatedDate;
    private String updatedBy;
}
