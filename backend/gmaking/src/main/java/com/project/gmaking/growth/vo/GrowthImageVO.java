package com.project.gmaking.growth.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GrowthImageVO {
    private Long imageId; // Primary Key. MyBatis의 keyProperty를 통해 INSERT 후 자동 채워집니다.
    private String imageUrl; // S3 또는 파일 시스템에 저장된 이미지의 접근 URL
    private String image_original_name;
    private LocalDateTime created_date;
    private LocalDateTime updated_date;
}
