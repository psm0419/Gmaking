package com.project.gmaking.growth.service;

import com.project.gmaking.character.service.GcsService;
import com.project.gmaking.character.vo.ImageUploadResponseVO;
import com.project.gmaking.growth.dao.GrowthDAO;
import com.project.gmaking.growth.dao.GrowthPreGeneratedDAO;
import com.project.gmaking.growth.vo.GrowthImageVO;
import com.project.gmaking.growth.vo.GrowthPreGeneratedVO;
import com.project.gmaking.growth.vo.GrowthRequestVO;
import com.project.gmaking.growth.vo.GrowthResponseVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class GrowthPreGeneratedService {

    private final GrowthDAO growthDAO;
    private final GrowthPreGeneratedDAO preGenDAO;
    private final GcsService gcsService;
    private final RestTemplate restTemplate;

    @Value("${ai.server.url:http://localhost:8001/api/v1/grow-character}")
    private String aiServerUrl;

    /** 조건에 맞는 캐릭터 목록 조회 */
    public List<Long> getEligibleCharacters() {
        return preGenDAO.findEligibleCharactersForPreGen();
    }

    /** 사전생성 실행 */
    @Transactional
    public void generatePreGrowthForCharacter(Long characterId) {
        try {
            String userId = growthDAO.findUserIdByCharacterId(characterId);
            Integer currentStep = growthDAO.findCharacterEvolutionStep(characterId);
            if (userId == null || currentStep == null) return;

            int nextStep = currentStep + 1;
            String evoKey = determineEvolutionKeyForCurrentStep(currentStep);

            // AI 서버 요청 준비
            GrowthRequestVO req = new GrowthRequestVO();
            req.setUser_id(userId);
            req.setCharacter_id(characterId);
            req.setEvolution_step(currentStep);
            req.setTarget_modification(evoKey);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            ResponseEntity<GrowthResponseVO> aiResEntity = restTemplate.exchange(
                    aiServerUrl,
                    HttpMethod.POST,
                    new HttpEntity<>(req, headers),
                    GrowthResponseVO.class
            );

            GrowthResponseVO aiRes = aiResEntity.getBody();
            if (aiRes == null || !"success".equals(aiRes.getStatus()) || aiRes.getImage_base64() == null) {
                log.warn("AI 처리 실패: 캐릭터 {}", characterId);
                return;
            }

            // GCS 업로드
            byte[] imgBytes = Base64.getDecoder().decode(aiRes.getImage_base64());
            ImageUploadResponseVO uploadRes = gcsService.uploadBase64Image(
                    imgBytes, "character-pre/" + userId, "png", "system_scheduler"
            );

            // 기존 이미지 ID 확인
            Long currentImageId = growthDAO.findCurrentImageId(characterId);
            if (currentImageId == null) {
                log.warn("⚠️ 캐릭터 {} 의 IMAGE_ID를 찾을 수 없습니다.", characterId);
                return;
            }

            // 사전생성 데이터 저장
            GrowthPreGeneratedVO preGen = new GrowthPreGeneratedVO();
            preGen.setCharacterId(characterId);
            preGen.setUserId(userId);
            preGen.setCurrentEvolutionStep(currentStep);
            preGen.setNextEvolutionStep(nextStep);
            preGen.setImageId(currentImageId);
            preGen.setImageUrl(uploadRes.getFileUrl());
            preGen.setCreatedBy("system_scheduler");

            preGenDAO.insertPreGeneratedImage(preGen);

            log.info("✅ 캐릭터 {} 사전생성 완료 → step {} → {}", characterId, currentStep, nextStep);

        } catch (Exception e) {
            log.error("❌ 캐릭터 {} 사전생성 실패: {}", characterId, e.getMessage());
        }
    }

    private String determineEvolutionKeyForCurrentStep(int currentStep) {
        switch (currentStep) {
            case 1: return "EVO_KEY_STAGE1";
            case 2: return "EVO_KEY_STAGE2";
            case 3: return "EVO_KEY_STAGE3";
            case 4: return "EVO_KEY_FINAL";
            default: return "EVO_KEY_INVALID";
        }
    }

    public GrowthPreGeneratedVO findPreGenerated(Long characterId, Integer nextStep) {
        return preGenDAO.findByCharacterAndStep(characterId, nextStep);
    }

    /** 사전생성 이미지를 실제 캐릭터에 반영 */
    @Transactional
    public boolean applyPreGeneratedImage(Long characterId, Integer nextStep, String userId) {
        GrowthPreGeneratedVO preGen = preGenDAO.findByCharacterAndStep(characterId, nextStep);
        if (preGen == null) {
            log.warn("❌ 사전생성 데이터 없음: charId={}, step={}", characterId, nextStep);
            return false;
        }

        log.info("✅ applyPreGeneratedImage 실행 - charId={}, userId={}, nextStep={}, imageId={}",
                characterId, userId, nextStep, preGen.getImageId());

        // 1️⃣ 기존 캐릭터 이미지 ID 조회
        Long currentImageId = growthDAO.findCurrentImageId(characterId);
        if (currentImageId == null) {
            System.out.println("❌ 이미지 ID 조회 실패");
            return false;
        }

        // 2️⃣ tb_image 테이블의 URL 업데이트
        GrowthImageVO newImage = new GrowthImageVO();
        newImage.setImageUrl(preGen.getImageUrl());
        newImage.setImage_original_name("preGenerated_" + System.currentTimeMillis());

        int updatedImageRows = growthDAO.updateImageRecord(currentImageId, newImage, userId);
        System.out.println("🧩 updateImageRecord 결과: " + updatedImageRows);

        int updatedRows = growthDAO.updateCharacterEvolution(characterId, userId, nextStep, preGen.getImageId());
        log.info("➡️ 캐릭터 업데이트 결과: {} rows", updatedRows);

        if (updatedRows > 0) {
            preGenDAO.markAsUsed(preGen.getPreGenId());
            log.info("✅ 사전생성 데이터 used=Y 변경 완료");
            return true;
        } else {
            log.warn("⚠️ 캐릭터 업데이트 실패: 조건 불일치 (charId={}, userId={})", characterId, userId);
            return false;
        }
    }
}
