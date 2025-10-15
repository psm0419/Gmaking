package com.project.gmaking.character.service;

import com.project.gmaking.character.dao.CharacterDAO;
import com.project.gmaking.character.service.ClassificationService;
import com.project.gmaking.character.service.GcsService;
import com.project.gmaking.character.service.StableDiffusionService;
import com.project.gmaking.character.vo.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Mono;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.List;

@Service
public class CharacterServiceSdImpl implements CharacterServiceSd {

    private final ClassificationService classificationService;
    private final StableDiffusionService sdService;
    private final GcsService gcsService;
    private final CharacterDAO characterDAO;

    public CharacterServiceSdImpl(
            ClassificationService classificationService,
            StableDiffusionService sdService,
            GcsService gcsService,
            CharacterDAO characterDAO) {

        this.classificationService = classificationService;
        this.sdService = sdService;
        this.gcsService = gcsService;
        this.characterDAO = characterDAO;
    }

    @Override
    @Transactional
    public Mono<CharacterGenerateResponseVO> generateCharacter(CharacterGenerateRequestVO requestVO, String userId) throws IOException {

        // 1. 이미지 분류 (FastAPI 호출)
        Mono<String> animalMono = classificationService.classifyImage(requestVO.getImage());

        return animalMono.flatMap(predictedAnimal -> {

            // 2. Stable Diffusion 프롬프트 조합
            String basePrompt = createPrompt(predictedAnimal, requestVO.getUserPrompt());

            // 3. Stable Diffusion 요청 VO 생성
            StableDiffusionRequestVO sdRequest = StableDiffusionRequestVO.builder()
                    .prompt(basePrompt)
                    .steps(20)
                    .width(256)
                    .height(256)
                    .cfg_scale(7.0)
                    .sampler_index("Euler")
                    .batch_size(1)
                    .n_iter(1)
                    .send_images(true)
                    .save_images(false)
                    .build();

            // 4. Stable Diffusion API 호출 (Base64 이미지 데이터 리스트 획득)
            return sdService.generateImage(sdRequest).flatMap(images -> {
                String base64Image = images.get(0);
                byte[] imageBytes = Base64.getDecoder().decode(base64Image);

                try {
                    // 4. GCS Upload 및 tb_image 저장 (기존 로직)
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


                    // 5. tb_character 테이블에 캐릭터 정보 저장
                    // CharacterDAO.java에 정의된 insertCharacter를 호출합니다.
                    Long characterId = characterDAO.insertCharacter(
                            userId,
                            requestVO.getCharacterName(),
                            imageId
                    );


                    // 6. 응답 VO 생성: characterId를 포함하여 최종 응답 빌드
                    return Mono.just(CharacterGenerateResponseVO.builder()
                            .characterId(characterId) // Character ID 포함
                            .characterName(requestVO.getCharacterName())
                            .imageUrl(imageResponse.getFileUrl())
                            .predictedAnimal(predictedAnimal)
                            .build());

                } catch (Exception e) {
                    // GCS 저장 또는 DB 저장 실패 시 런타임 오류로 변환
                    System.err.println("GCS 저장 또는 DB 저장 중 오류 발생: " + e.getMessage());
                    return Mono.error(new RuntimeException("캐릭터 데이터 저장 중 오류 발생: " + e.getMessage()));
                }
            });
        });
    }

    /**
     * 분류 결과와 사용자 입력을 결합하여 최종 프롬프트를 생성
     */
    private String createPrompt(String predictedAnimal, String userPrompt) {
        // 프롬프트 로직
        return String.format("%s, %s, digital art, highly detailed, fantasy, epic lighting", predictedAnimal, userPrompt);
    }
    
}