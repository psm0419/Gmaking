package com.project.gmaking.character.vo;

import lombok.Data;
import java.util.List;

@Data
public class StableDiffusionResponseVO {

    // API 응답에서 가장 중요한 Base64 이미지 리스트
    private List<String> images;


}