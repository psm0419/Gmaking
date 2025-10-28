package com.project.gmaking.growth.service;

import com.project.gmaking.character.service.GcsService; // 💡 GcsService 임포트 추가
import com.project.gmaking.character.vo.ImageUploadResponseVO; // 💡 GCS 응답 VO 임포트 추가
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

import java.io.IOException;
import java.util.Base64;

@Service
@RequiredArgsConstructor
public class GrowthService {
    private final GrowthDAO growthDAO;
    private final RestTemplate restTemplate;
    private final GcsService gcsService; // 💡 GcsService 주입

    // AI 서버 URL 설정 (포트 8001 유지)
    //@Value("${ai.server.url:http://192.168.1.107:8001/api/v1/grow-character}")
    @Value("${ai.server.url:http://localhost:8001/api/v1/grow-character}")
    private String aiServerUrl;

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
        int nextStep = currentStep + 1; // 다음 단계 계산 (DB 업데이트에 필요)

        // 2. 다음 단계에 해당하는 프롬프트 키(targetModification) 결정
        String targetModificationKey = determineEvolutionKeyForCurrentStep(currentStep);

        // 3. AI 서버 요청 파라미터 구성 (VO에 값 설정)
        requestVO.setTarget_modification(targetModificationKey);
        requestVO.setEvolution_step(currentStep); // 현재 단계로 설정

        // 4. AI 서버 통신 (로직 유지)
        ResponseEntity<GrowthResponseVO> aiResponseEntity;
        try{
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<GrowthRequestVO> entity = new HttpEntity<>(requestVO, headers);

            aiResponseEntity = restTemplate.exchange(
                    aiServerUrl, HttpMethod.POST, entity, GrowthResponseVO.class
            );

        } catch (Exception e) {
            System.err.println("AI 서버 통신 실패: " + e.getMessage());
            if (e.getMessage().contains("404")) {
                System.err.println("경고: AI 서버 URL 또는 Python 라우팅 경로가 잘못되었습니다. 요청 URL: " + aiServerUrl);
            }
            throw new RuntimeException("AI server request failed: " + e.getMessage(), e);
        }

        GrowthResponseVO aiResponse = aiResponseEntity.getBody();

        if (aiResponse == null || !"success".equals(aiResponse.getStatus()) || aiResponse.getImage_base64() == null) {
            String status = aiResponse != null ? aiResponse.getStatus() : "Null response";
            System.err.println("AI 처리 실패 상태: " + status);
            throw new RuntimeException("AI processing failed. Status: " + status);
        }

        // --- 5. Base64 이미지 저장 (GCS) 및 tb_image 업데이트 ---
        String base64Image = aiResponse.getImage_base64();

        // 5.1. user_id 및 Image ID 조회 (로직 유지)
        Long newCharacterId = aiResponse.getCharacter_id();
        String newUserId = growthDAO.findUserIdByCharacterId(newCharacterId);
        if (newUserId == null) {
            throw new RuntimeException("User ID not found for Character ID: " + newCharacterId + ". Cannot save image.");
        }
        Long currentImageId = growthDAO.findCurrentImageId(newCharacterId);
        if (currentImageId == null) {
            throw new RuntimeException("Image ID not found for Character ID: " + newCharacterId + ". Cannot update image.");
        }
        Long newImageId = currentImageId;
        Integer newStep = aiResponse.getNew_evolution_step() != null ? aiResponse.getNew_evolution_step() : nextStep;

        try {
            // 5.2. Base64 디코딩 및 GCS 업로드
            byte[] imageBytes = Base64.getDecoder().decode(base64Image);

            // 💡 [핵심] GCS 서비스 호출하여 이미지 업로드
            ImageUploadResponseVO uploadResult = gcsService.uploadBase64Image(
                    imageBytes,
                    "character/" + newUserId, // GCS 폴더 경로: character/USER_ID
                    "png",       // 확장자
                    newUserId    // 생성자 ID
            );

            // 5.3. tb_image 레코드 업데이트 (GCS URL 사용)
            String gcsImageUrl = uploadResult.getFileUrl();
            String gcsFileName = uploadResult.getFileName(); // GCS에 저장된 UUID 파일 이름

            GrowthImageVO newImage = new GrowthImageVO();
            newImage.setImageUrl(gcsImageUrl); // 🌟 GCS URL 기록

            // 💡 GCS 파일 이름 기록 (UUID)
            newImage.setImage_original_name(gcsFileName);

            // 💡 UPDATE 호출 (newImageId 사용)
            int updatedImageRows = growthDAO.updateImageRecord(newImageId, newImage, newUserId);

            if (updatedImageRows != 1) {
                throw new RuntimeException("Failed to update tb_image record for ID: " + newImageId);
            }

        } catch (IOException e){
            System.err.println("GCS 이미지 업로드 및 DB 기록 중 오류 발생: " + e.getMessage());
            throw new RuntimeException("GCS image save or image DB record failed.", e);
        }

        // --- 6. tb_character 최종 업데이트 ---
        // 로직 유지
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
     * 로직 유지
     */
    private String determineEvolutionKeyForCurrentStep(int currentStep) {
        switch (currentStep) {
            case 1: // 현재 STAGE1 -> 다음 STAGE2로 갈 때
                return "EVO_KEY_STAGE1";
            case 2:
                return "EVO_KEY_STAGE2";
            case 3:
                return "EVO_KEY_STAGE3";
            case 4: // 현재 미구현, 코드만 있음
                return "EVO_KEY_FINAL";
            default:
                return "EVO_KEY_INVALID";
        }
    }
}