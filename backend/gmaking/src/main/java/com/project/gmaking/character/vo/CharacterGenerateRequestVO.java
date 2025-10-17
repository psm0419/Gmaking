package com.project.gmaking.character.vo;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

// React의 요청 (이미지 + 프롬프트)을 받는 DTO
@Data
public class CharacterGenerateRequestVO {
    private MultipartFile image;        // 사용자가 업로드한 동물 이미지
    private String userPrompt;          // 사용자가 입력한 추가 프롬프트
    private String characterName;       // 생성할 캐릭터 이름 (tb_character에 저장)
}