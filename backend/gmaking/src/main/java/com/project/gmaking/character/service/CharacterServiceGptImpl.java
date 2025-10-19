package com.project.gmaking.character.service;

import com.project.gmaking.character.dao.CharacterDAO;
import com.project.gmaking.character.service.ClassificationService;
import com.project.gmaking.character.service.GcsService;
import com.project.gmaking.character.vo.*;
import com.project.gmaking.login.dao.LoginDAO;
import com.project.gmaking.login.vo.LoginVO;
import com.project.gmaking.character.dao.CharacterStatDAO;
import com.project.gmaking.security.JwtTokenProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Mono;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.Base64;
import java.time.LocalDateTime;
import java.util.Random;

@Service
public class CharacterServiceGptImpl implements CharacterServiceGpt {

    private static final Logger logger = LoggerFactory.getLogger(CharacterServiceGptImpl.class);
    private final ClassificationService classificationService;
    private final GptImageService gptImageService;
    private final GcsService gcsService;
    private final CharacterDAO characterDAO;
    private final CharacterStatDAO characterStatDAO;
    private final LoginDAO loginDAO;
    private final JwtTokenProvider jwtTokenProvider;


    public CharacterServiceGptImpl(
            ClassificationService classificationService,
            GcsService gcsService,
            CharacterDAO characterDAO,
            CharacterStatDAO characterStatDAO,
            LoginDAO loginDAO,
            JwtTokenProvider jwtTokenProvider,
            GptImageService gptImageService) {

        this.classificationService = classificationService;
        this.gcsService = gcsService;
        this.characterDAO = characterDAO;
        this.characterStatDAO = characterStatDAO;
        this.loginDAO = loginDAO;
        this.jwtTokenProvider = jwtTokenProvider;
        this.gptImageService = gptImageService;
    }

    /**
     * 캐릭터 미리보기 생성 (이미지 분류, GPT 이미지 생성, GCS 임시 저장)
     */
    @Override
    public Mono<CharacterGenerateResponseVO> generateCharacterPreview(CharacterGenerateRequestVO requestVO, String userId) throws IOException {

        // 이미지 분류 (Mono<String> predictedAnimal)
        return classificationService.classifyImage(requestVO.getImage())
                .flatMap(predictedAnimal -> {
                    logger.info("분류된 동물: {}", predictedAnimal);

                    // GPT(DALL-E)로 이미지 생성 (Mono<List<String>> base64Images)
                    return gptImageService.generateImage(predictedAnimal, requestVO.getCharacterName(), requestVO.getUserPrompt())
                            .flatMap(base64Images -> {
                                if (base64Images == null || base64Images.isEmpty()) {
                                    return Mono.error(new RuntimeException("GPT 이미지 생성에 실패했습니다."));
                                }

                                String base64Image = base64Images.get(0); // 첫 번째 이미지 사용
                                byte[] imageBytes = Base64.getDecoder().decode(base64Image);

                                try {
                                    // GCS 임시 저장 (DB 저장 X) 이미지 파일을 GCS에 저장하고 URL을 받음.
                                    ImageUploadResponseVO imageResponse = gcsService.uploadBase64Image(imageBytes, "temp-characters", "png", userId);

                                    return Mono.just(CharacterGenerateResponseVO.builder()
                                            .characterName(requestVO.getCharacterName())
                                            .imageUrl(imageResponse.getFileUrl()) // 미리보기 URL
                                            .predictedAnimal(predictedAnimal)
                                            .build());

                                } catch (IOException e) {
                                    logger.error("GCS 임시 저장 중 오류 발생: {}", e.getMessage(), e);
                                    return Mono.error(new RuntimeException("캐릭터 이미지 저장 중 오류 발생: " + e.getMessage()));
                                }
                            });
                });
    }


    /**
     * 캐릭터 최종 확정 (DB 저장 및 JWT 토큰 재발급)
     * @Transactional 모든 DB 작업이 성공적으로 완료되도록 보장
     */
    @Override
    @Transactional
    public CharacterGenerateResponseVO finalizeCharacter(CharacterGenerateResponseVO finalData, String userId) {

        // Null 체크 및 필수 데이터 검증 (500 오류 방지)
        if (finalData == null || finalData.getImageUrl() == null || finalData.getCharacterName() == null || finalData.getPredictedAnimal() == null) {
            logger.error("캐릭터 최종 확정 데이터가 불완전합니다. finalData: {}", finalData);
            throw new IllegalArgumentException("캐릭터 최종 확정 데이터가 불완전합니다.");
        }

        try {
            // ImageVO 생성 및 DB 저장
            ImageVO imageVO = new ImageVO();
            imageVO.setImageOriginalName(finalData.getCharacterName() + "_image");
            imageVO.setImageUrl(finalData.getImageUrl());
            imageVO.setImageName(finalData.getImageUrl().substring(finalData.getImageUrl().lastIndexOf("/") + 1));
            imageVO.setImageType(1);
            imageVO.setCreatedBy(userId);
            characterDAO.insertImage(imageVO);
            Long imageId = imageVO.getImageId();

            // CharacterVO 생성 및 DB 저장
            CharacterVO characterVO = new CharacterVO();
            characterVO.setUserId(userId);
            characterVO.setImageId(imageId);
            characterVO.setCharacterName(finalData.getCharacterName());
            characterVO.setBackgroundInfo(finalData.getPredictedAnimal() + " 타입의 캐릭터");
            characterVO.setGradeId(1);
            characterVO.setTotalStageClears(0);
            characterVO.setEvolutionStep(1);
            characterVO.setCreatedDate(LocalDateTime.now());
            characterVO.setCreatedBy(userId);
            characterDAO.insertCharacter(characterVO);
            Integer characterId = characterVO.getCharacterId();

            // characterStatVO 생성 및 DB 저장
            Random random = new Random();
            CharacterStatVO statVO = new CharacterStatVO();
            statVO.setCharacterId(characterId);
            statVO.setCharacterHp(100 + random.nextInt(50));
            statVO.setCharacterAttack(10 + random.nextInt(5));
            statVO.setCharacterDefense(5 + random.nextInt(3));
            statVO.setCharacterSpeed(3 + random.nextInt(3));
            statVO.setCriticalRate(5 + random.nextInt(5));
            statVO.setCreatedDate(LocalDateTime.now());
            statVO.setCreatedBy(userId);
            characterStatDAO.insertCharacterStat(statVO);

            // 사용자 정보 업데이트 및 새 토큰 생성
            loginDAO.updateUserCharacterInfo(userId, finalData.getImageUrl());

            LoginVO updatedUser = loginDAO.selectUserById(userId);
            String newToken = jwtTokenProvider.createToken(
                    updatedUser.getUserId(),
                    updatedUser.getRole(),
                    updatedUser.getUserNickname(),
                    updatedUser.isHasCharacter(), // true로 업데이트됨
                    updatedUser.getCharacterImageUrl() // URL로 업데이트됨
            );

            // newToken 포함
            return CharacterGenerateResponseVO.builder()
                    .characterId(characterId)
                    .characterName(finalData.getCharacterName())
                    .imageUrl(finalData.getImageUrl())
                    .predictedAnimal(finalData.getPredictedAnimal())
                    .newToken(newToken)
                    .build();

        } catch (Exception e) {
            // Transactional 롤백 유도
            logger.error("캐릭터 최종 확정 처리 중 오류 발생 (DB/토큰): {}", e.getMessage(), e);
            throw new RuntimeException("캐릭터 최종 확정 처리 중 서버 내부 오류가 발생했습니다.", e);
        }
    }
}