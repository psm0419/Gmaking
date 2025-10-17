package com.project.gmaking.character.vo;

import lombok.Data;

@Data
public class ImageVO {
    private Long imageId;
    private String imageOriginalName;
    private String imageUrl;            // GCS URL
    private String imageName;           // GCS 저장 파일명
    private Integer imageType;
    private String createdBy;
}