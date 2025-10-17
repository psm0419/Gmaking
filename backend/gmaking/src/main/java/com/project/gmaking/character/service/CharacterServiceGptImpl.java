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

    @Override
    @Transactional
    public Mono<CharacterGenerateResponseVO> generateCharacter(CharacterGenerateRequestVO requestVO, String userId) throws IOException {

        // 1. 이미지 분류 (FastAPI 호출) - 기존 로직 유지
        Mono<String> animalMono = classificationService.classifyImage(requestVO.getImage());

        // requestVO에서 캐릭터 이름과 사용자 프롬프트 추출
        String characterName = requestVO.getCharacterName();
        String userPrompt = requestVO.getUserPrompt();

        return animalMono.flatMap(predictedAnimal -> {

            // 2. GPT (DALL-E) API 호출로 이미지 생성 (기존 Stable Diffusion 호출 대체)
            return gptImageService.generateImage(predictedAnimal, characterName, userPrompt)
                    .flatMap(images -> {
                        // DALL-E API에서 받은 Base64 이미지 데이터 처리 (SD 응답과 동일 형식)
                        String base64Image = images.get(0);
                        byte[] imageBytes = Base64.getDecoder().decode(base64Image);

                        try {
                            // 3. GCS Upload 및 tb_image 저장 (기존 로직 유지)
                            ImageUploadResponseVO imageResponse = gcsService.uploadBase64Image(
                                    imageBytes, "characters", "png", userId);
                            logger.info("Image uploaded to GCS: {}", imageResponse.getFileUrl());

                            ImageVO imageVO = new ImageVO();
                            imageVO.setImageOriginalName(requestVO.getCharacterName() + "_char.png");
                            imageVO.setImageUrl(imageResponse.getFileUrl());
                            imageVO.setImageName(imageResponse.getFileName());
                            imageVO.setImageType(1);
                            imageVO.setCreatedBy(userId);

                            characterDAO.insertImage(imageVO);
                            Long imageId = imageVO.getImageId(); // tb_image 저장 후 PK 가져옴

                            if (imageId == null) {
                                throw new RuntimeException("이미지 저장 실패: imageId가 null입니다.");
                            }
                            logger.info("Image saved to DB with imageId: {}", imageId);

                            // 4. tb_character 테이블에 캐릭터 정보 저장
                            CharacterVO characterVO = new CharacterVO();
                            characterVO.setUserId(userId);
                            characterVO.setCharacterName(requestVO.getCharacterName());
                            characterVO.setImageId(imageId);
                            characterVO.setCreatedBy(userId);
                            characterDAO.insertCharacter(characterVO);
                            Integer characterId = characterVO.getCharacterId();
                            logger.info("Character saved to DB with characterId: {}", characterId);

                            // 5. 랜덤 스탯 생성
                            Random random = new Random();
                            int hp = random.nextInt(201) + 100;  // 100~300
                            int attack = random.nextInt(200) + 1;  // 1~200
                            int defense = random.nextInt(100) + 1;  // 1~100
                            int speed = random.nextInt(100) + 1;  // 1~100
                            int critical = random.nextInt(100) + 1;  // 1~100

                            int total = hp + attack + defense + speed + critical;

                            // 총합에 따라 grade_id 결정
                            int gradeId;
                            if (total <= 200) {
                                gradeId = 1;
                            } else if (total <= 300) {
                                gradeId = 2;
                            } else if (total <= 400) {
                                gradeId = 3;
                            } else {
                                gradeId = 4;
                            }
                            logger.info("Generated stats: hp={}, attack={}, defense={}, speed={}, critical={}, total={}, gradeId={}",
                                    hp, attack, defense, speed, critical, total, gradeId);

                            // 6. TB_CHARACTER_STAT에 스탯 삽입
                            CharacterStatVO statVO = new CharacterStatVO();
                            statVO.setCharacterId(characterId);
                            statVO.setCharacterHp(hp);
                            statVO.setCharacterAttack(attack);
                            statVO.setCharacterDefense(defense);
                            statVO.setCharacterSpeed(speed);
                            statVO.setCriticalRate(critical);
                            statVO.setCreatedBy(userId);
                            statVO.setUpdatedBy(userId);

                            characterStatDAO.insertCharacterStat(statVO);
                            logger.info("Character stats saved for characterId: {}", characterId);

                            // TB_CHARACTER의 grade_id 업데이트
                            characterDAO.updateGradeId(gradeId, characterId);
                            logger.info("Grade ID updated for characterId: {}", characterId);

                            // 7. TB_USER 업데이트 및 새 토큰 생성 (기존 로직 유지)
                            String imageUrl = imageResponse.getFileUrl();
                            loginDAO.updateUserCharacterInfo(userId, imageUrl);

                            LoginVO updatedUser = loginDAO.selectUserById(userId);
                            String newToken = jwtTokenProvider.createToken(
                                    updatedUser.getUserId(),
                                    updatedUser.getRole(),
                                    updatedUser.getUserNickname(),
                                    updatedUser.isHasCharacter(),
                                    updatedUser.getCharacterImageUrl()
                            );

                            // 8. 응답 VO 생성
                            return Mono.just(CharacterGenerateResponseVO.builder()
                                    .characterId(characterId)
                                    .characterName(requestVO.getCharacterName())
                                    .imageUrl(imageResponse.getFileUrl())
                                    .predictedAnimal(predictedAnimal)
                                    //.newToken(newToken)
                                    .build());

                        } catch (Exception e) {
                            // GCS 저장 또는 DB 저장 실패 시 런타임 오류로 변환
                            logger.error("GCS 저장 또는 DB 저장 중 오류 발생: {}", e.getMessage(), e);
                            return Mono.error(new RuntimeException("캐릭터 데이터 저장 중 오류 발생: " + e.getMessage()));
                        }
                    });
        });
    }

}