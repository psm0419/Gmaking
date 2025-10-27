package com.project.gmaking.admin.vo;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ImageVO {
    private Integer imageId;
    private String imageOriginalName;       // IMAGE_ORIGINAL_NAME
    private String imageUrl;                // IMAGE_URL (GCS 경로)
    private String imageName;               // IMAGE_NAME (서버 저장 이름)
    private Integer imageType;              // IMAGE_TYPE (0: profile, 1: character, 2: monster)

    // 공통 필드
    private LocalDateTime createdDate;
    private String createdBy;
    private LocalDateTime updatedDate;
    private String updatedBy;
}