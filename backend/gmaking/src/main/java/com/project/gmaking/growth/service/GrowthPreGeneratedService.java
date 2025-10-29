package com.project.gmaking.growth.service;

import com.project.gmaking.growth.dao.GrowthDAO;
import com.project.gmaking.growth.dao.GrowthPreGeneratedDAO;
import com.project.gmaking.growth.vo.GrowthPreGeneratedVO;
import com.project.gmaking.growth.vo.GrowthRequestVO;
import com.project.gmaking.growth.vo.GrowthResponseVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class GrowthPreGeneratedService {

    private final GrowthDAO growthDAO;
    private final GrowthService growthService;
    private final GrowthPreGeneratedDAO preGenDAO;

    /**
     * 사전 생성 대상 캐릭터 조회
     */
    public List<Integer> getEligibleCharacters() {
        return preGenDAO.findEligibleCharactersForPreGen();
    }

    /**
     * 개별 캐릭터에 대해 사전 생성 이미지 생성 및 DB 저장
     */
    @Transactional
    public void generatePreGrowthForCharacter(Integer characterId) {
        try {
            String userId = growthDAO.findUserIdByCharacterId(Long.valueOf(characterId));
            Integer currentStep = growthDAO.findCharacterEvolutionStep(Long.valueOf(characterId));
            if (userId == null || currentStep == null) {
                log.warn("캐릭터 ID {} 유효하지 않음", characterId);
                return;
            }

            GrowthRequestVO req = new GrowthRequestVO();
            req.setUser_id(userId);
            req.setCharacter_id(Long.valueOf(characterId));
            req.setEvolution_step(currentStep);

            // AI 서버 요청 (이미 GCS 업로드 포함)
            GrowthResponseVO aiRes = growthService.processCharacterGrowth(req);

            // 생성된 이미지 DB에 저장
            GrowthPreGeneratedVO preGen = new GrowthPreGeneratedVO();
            preGen.setCharacterId(characterId);
            preGen.setUserId(userId);
            preGen.setCurrentEvolutionStep(currentStep);
            preGen.setNextEvolutionStep(aiRes.getNew_evolution_step());
            preGen.setImageUrl(aiRes.getImage_base64()); // GCS URL로 교체 필요 시 수정
            preGen.setImageId(growthDAO.findCurrentImageId(Long.valueOf(characterId)).intValue());
            preGen.setCreatedBy("system_scheduler");

            preGenDAO.insertPreGeneratedImage(preGen);

            log.info("캐릭터 {} (user:{}) 사전 생성 성공, step {} → {}",
                    characterId, userId, currentStep, aiRes.getNew_evolution_step());

        } catch (Exception e) {
            log.error("캐릭터 ID {} 사전 생성 실패: {}", characterId, e.getMessage(), e);
        }
    }

    /**
     * 사용자 클릭 시 사전 생성 이미지 확인
     */
    public GrowthPreGeneratedVO findPreGenerated(Integer characterId, Integer nextStep) {
        return preGenDAO.findByCharacterAndStep(characterId, nextStep);
    }
}
