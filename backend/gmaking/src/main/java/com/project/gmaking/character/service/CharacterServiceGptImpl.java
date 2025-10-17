package com.project.gmaking.character.service;

import com.project.gmaking.character.dao.CharacterDAO;
import com.project.gmaking.character.service.ClassificationService;
import com.project.gmaking.character.service.GcsService;
import com.project.gmaking.character.vo.*;
import com.project.gmaking.login.dao.LoginDAO;
import com.project.gmaking.login.vo.LoginVO;
import com.project.gmaking.security.JwtTokenProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.util.Base64;

@Service
public class CharacterServiceGptImpl implements CharacterServiceGpt {

    private final ClassificationService classificationService;
    private final GptImageService gptImageService;
    private final GcsService gcsService;
    private final CharacterDAO characterDAO;
    private final LoginDAO loginDAO;
    private final JwtTokenProvider jwtTokenProvider;

    public CharacterServiceGptImpl(
            ClassificationService classificationService,
            GcsService gcsService,
            CharacterDAO characterDAO,
            LoginDAO loginDAO,
            JwtTokenProvider jwtTokenProvider,
            GptImageService gptImageService) {

        this.classificationService = classificationService;
        this.gcsService = gcsService;
        this.characterDAO = characterDAO;
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

                            ImageVO imageVO = new ImageVO();
                            imageVO.setImageOriginalName(requestVO.getCharacterName() + "_char.png");
                            imageVO.setImageUrl(imageResponse.getFileUrl());
                            imageVO.setImageName(imageResponse.getFileName());
                            imageVO.setImageType(1);
                            imageVO.setCreatedBy(userId);

                            characterDAO.insertImage(imageVO);
                            Long imageId = imageVO.getImageId(); // tb_image 저장 후 PK 가져옴


                            // 4. tb_character 테이블에 캐릭터 정보 저장 (기존 로직 유지)
                            Long characterId = characterDAO.insertCharacter(
                                    userId,
                                    requestVO.getCharacterName(),
                                    imageId
                            );

                            // 5. TB_USER 업데이트 및 새 토큰 생성 (기존 로직 유지)
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

                            // 6. 응답 VO 생성
                            return Mono.just(CharacterGenerateResponseVO.builder()
                                    .characterId(characterId)
                                    .characterName(requestVO.getCharacterName())
                                    .imageUrl(imageResponse.getFileUrl())
                                    .predictedAnimal(predictedAnimal)
                                    //.newToken(newToken)
                                    .build());

                        } catch (Exception e) {
                            // GCS 저장 또는 DB 저장 실패 시 런타임 오류로 변환
                            System.err.println("GCS 저장 또는 DB 저장 중 오류 발생: " + e.getMessage());
                            return Mono.error(new RuntimeException("캐릭터 데이터 저장 중 오류 발생: " + e.getMessage()));
                        }
                    });
        });
    }

}