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
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.MediaType;
import org.springframework.http.HttpMethod;

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
        // Request VO (이미 수정 완료)
        Long characterId = requestVO.getCharacter_id();
        // String userId = requestVO.getUser_id(); // 이 값은 Controller에서 설정됨

        // 1. 현재 캐릭터의 진화 단계를 DB에서 조회
        Integer currentStep = growthDAO.findCharacterEvolutionStep(characterId);
        if (currentStep == null) {
            throw new RuntimeException("Character not found for ID: " + characterId);
        }
        int nextStep = currentStep + 1;

        // 2. 다음 단계에 해당하는 프롬프트 키(targetModification) 결정
        String targetModificationKey = determineNextEvolutionKey(nextStep);

        // 3. AI 서버 요청 파라미터 구성 (VO에 값 설정)
        requestVO.setTarget_modification(targetModificationKey);
        requestVO.setEvolution_step(nextStep);

        // 4. AI 서버 통신
        ResponseEntity<GrowthResponseVO> aiResponseEntity;
        try{
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<GrowthRequestVO> entity = new HttpEntity<>(requestVO, headers);

            aiResponseEntity = restTemplate.exchange(
                    aiServerUrl,
                    HttpMethod.POST,
                    entity,
                    GrowthResponseVO.class
            );

        } catch (Exception e) {
            System.err.println("AI 서버 통신 실패: " + e.getMessage());
            throw new RuntimeException("AI server request failed: " + e.getMessage(), e);
        }

        GrowthResponseVO aiResponse = aiResponseEntity.getBody();

        if (aiResponse == null || !"success".equals(aiResponse.getStatus()) || aiResponse.getImage_base64() == null) {
            String status = aiResponse != null ? aiResponse.getStatus() : "Null response";
            System.err.println("AI 처리 실패 상태: " + status);
            throw new RuntimeException("AI processing failed. Status: " + status);
        }

        // --- 5. Base64 이미지 저장 및 tb_image 업데이트 ---
        String base64Image = aiResponse.getImage_base64();

        // 5.1. tb_character에서 user_id와 현재 Image ID 조회
        Long newCharacterId = aiResponse.getCharacter_id();
        String newUserId = growthDAO.findUserIdByCharacterId(newCharacterId);

        if (newUserId == null) {
            throw new RuntimeException("User ID not found for Character ID: " + newCharacterId + ". Cannot save image.");
        }

        // 💡 핵심 수정 1: 현재 캐릭터가 사용 중인 이미지 ID를 조회합니다.
        Long currentImageId = growthDAO.findCurrentImageId(newCharacterId);
        if (currentImageId == null) {
            // 캐릭터 생성 시점에 IMAGE_ID가 설정되어야 함. 없으면 오류 처리
            throw new RuntimeException("Image ID not found for Character ID: " + newCharacterId + ". Cannot update image.");
        }
        Long newImageId = currentImageId; // UPDATE이므로 IMAGE_ID는 동일

        Integer newStep = aiResponse.getNew_evolution_step() != null ? aiResponse.getNew_evolution_step() : nextStep;


        // 5.2. 파일 시스템 경로 및 이름 결정 (DB에서 조회한 newUserId 사용)
        // 파일 이름은 새 단계로 변경하여, 기존 파일을 덮어쓰도록 합니다.
        String fileSystemDir = IMAGE_STORAGE_BASE_PATH + newUserId + "/";
        String fileName = newCharacterId + "_step" + newStep + ".png"; // 기존 파일명 덮어쓰기

        File targetDir = new File(fileSystemDir);
        if (!targetDir.exists()) targetDir.mkdirs();
        File targetFile = new File(targetDir, fileName);

        try {
            // 5.3. Base64 디코딩 및 PNG 파일로 저장
            byte[] imageBytes = Base64.getDecoder().decode(base64Image);

            try (ByteArrayInputStream bis = new ByteArrayInputStream(imageBytes)) {
                BufferedImage bImage = ImageIO.read(bis);
                if (bImage == null) {
                    throw new IOException("Failed to read image data from Base64 stream.");
                }
                ImageIO.write(bImage, "png", targetFile);
            }

            // 5.4. tb_image 레코드 업데이트 (기존 레코드에 덮어쓰기)
            String dbImageUrl = BASE_ASSET_URL_PATH + newUserId + "/" + fileName;

            GrowthImageVO newImage = new GrowthImageVO();
            newImage.setImageUrl(dbImageUrl);

            // 💡 핵심 수정 2: GrowthImageVO의 Snake Case 필드명에 맞춰 Setter 호출 (Lombok이 생성한 Setter 사용)
            newImage.setImage_original_name(fileName);

            // 💡 핵심 수정 3: INSERT 대신 UPDATE 호출 (newImageId 사용)
            int updatedImageRows = growthDAO.updateImageRecord(newImageId, newImage, newUserId);

            if (updatedImageRows != 1) {
                throw new RuntimeException("Failed to update tb_image record for ID: " + newImageId);
            }

        } catch (IOException e){
            System.err.println("이미지 저장 및 DB 기록 중 오류 발생: " + e.getMessage());
            throw new RuntimeException("Image save or image DB record failed.", e);
        }

        // --- 6. tb_character 최종 업데이트 ---
        // IMAGE_ID는 newImageId (currentImageId와 동일)로 그대로 두되, EVOLUTION_STEP만 업데이트합니다.
        int updatedRows = growthDAO.updateCharacterEvolution(
                newCharacterId, newUserId, newStep, newImageId
        );

        if (updatedRows != 1) {
            throw new RuntimeException("Failed to update tb_character evolution step/image ID. Updated rows: " + updatedRows);
        }

        System.out.println("✅ 캐릭터 진화 최종 완료: ID " + newCharacterId + " -> Step " + newStep + " with Image ID " + newImageId);

        // 최종 결과 반환
        return aiResponse;
    }

    /**
     * 성장 단계에 따라 AI 서버에 전달할 키(targetModification)를 결정합니다.
     * 이 키는 파이썬 서버가 단계별 프롬프트와 배경 로직을 실행하는 데 사용됩니다.
     * @param step 다음 진화 단계 번호
     */
    private String determineNextEvolutionKey(int step) {
        // 파이썬 서버와 약속된 키를 사용해야 합니다.
        switch (step) {
            case 1:
                return "EVO_KEY_INITIAL";
            case 2:
                return "EVO_KEY_EGG";
            case 3:
                return "EVO_KEY_BABY";
            case 4:
                return "EVO_KEY_TEEN";
            default:
                return "EVO_KEY_FINAL";
        }
    }
}
