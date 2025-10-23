package com.project.gmaking.growth.service;

import com.project.gmaking.growth.dao.GrowthDAO;
import com.project.gmaking.growth.vo.GrowthImageVO;
import com.project.gmaking.growth.vo.GrowthRequestVO;
import com.project.gmaking.growth.vo.GrowthResponseVO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GrowthService {
    private final GrowthDAO growthDAO;
    private final RestTemplate restTemplate;

    @Value("${ai.server.url:http://localhost:8000/api/v1/grow-character}")
    private String aiServerUrl;

    private final String IMAGE_STORAGE_BASE_PATH = "/data/images/character/";
    private final String BASE_ASSET_URL_PATH = "/images/character/";

    @Transactional
    public GrowthResponseVO processCharacterGrowth(GrowthRequestVO requestVO){
        Map<String, Object> params = new HashMap<>();
        params.put("user_id", requestVO.getUserId());
        params.put("character_id", requestVO.getCharacterId());
        params.put("target_modification", requestVO.getTargetModification());

        ResponseEntity<GrowthResponseVO> aiResponseEntity = null;
        try{
            if (aiResponseEntity == null) {
                throw new RuntimeException("AI Server communication stub error: Actual request not implemented.");
            }
        } catch (Exception e) {
            System.err.println("AI 서버 통신 실패: " + e.getMessage());
            throw new RuntimeException("AI server request failed: " + e.getMessage());
        }

        GrowthResponseVO aiResponse = aiResponseEntity.getBody();

        if (aiResponse == null || !"success".equals(aiResponse.getStatus())) {
            throw new RuntimeException("AI processing failed: " + (aiResponse != null ? aiResponse.getStatus() : "Null response"));
        }

        // --- 2. Base64 이미지 저장 및 tb_image 업데이트 ---
        String base64Image = aiResponse.getImageBase64();
        String userId = aiResponse.getUserId();
        Long characterId = aiResponse.getCharacterId();
        Integer newStep = aiResponse.getNewEvolutionStep();

        // 2.1. 파일 시스템 경로 및 이름 결정
        // 파일 시스템에는 유저 ID별로 폴더를 만들어 저장하는 것이 일반적입니다.
        String fileSystemDir = IMAGE_STORAGE_BASE_PATH + userId + "/";
        String fileName = characterId + "_step" + newStep + ".png";

        File targetDir = new File(fileSystemDir);
        if (!targetDir.exists()) targetDir.mkdirs();
        File targetFile = new File(targetDir, fileName);

        Long newImageId;

        try {
            // 2.2. Base64 디코딩 및 PNG 파일로 저장 (이전 로직과 동일)
            byte[] imageBytes = Base64.getDecoder().decode(base64Image);

            try (ByteArrayInputStream bis = new ByteArrayInputStream(imageBytes)) {
                BufferedImage bImage = ImageIO.read(bis);
                if (bImage == null) {
                    throw new IOException("Failed to read image data from Base64 stream.");
                }
                ImageIO.write(bImage, "png", targetFile);
            }

            // 2.3. tb_image에 새 레코드 삽입 및 IMAGE_ID 받기
            String dbImageUrl = BASE_ASSET_URL_PATH + userId + "/" + fileName;

            GrowthImageVO newImage = new GrowthImageVO();
            newImage.setUserId(userId);
            newImage.setImageUrl(dbImageUrl);

            growthDAO.insertNewImageRecord(newImage);
            newImageId = newImage.getImageId();

        } catch (IOException e){
            System.err.println("이미지 저장 및 DB 기록 중 오류 발생: " + e.getMessage());
            throw new RuntimeException("Image save or image DB record failed.", e);
        }

        // --- 3. tb_character 최종 업데이트 (이전 로직과 동일) ---
        int updatedRows = growthDAO.updateCharacterEvolution(
                characterId, userId, newStep, newImageId
        );

        if (updatedRows != 1) {
            throw new RuntimeException("Failed to update tb_character evolution step/image ID. Updated rows: " + updatedRows);
        }

        System.out.println("✅ 캐릭터 진화 최종 완료: ID " + characterId + " -> Step " + newStep + " with Image ID " + newImageId);

        // 최종 결과 반환
        return aiResponse;
    }
}
