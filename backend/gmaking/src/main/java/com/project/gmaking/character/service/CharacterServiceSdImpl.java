package com.project.gmaking.character.service;

import com.project.gmaking.character.dao.CharacterDAO;
import com.project.gmaking.character.service.ClassificationService;
import com.project.gmaking.character.service.GcsService;
import com.project.gmaking.character.service.StableDiffusionService;
import com.project.gmaking.character.vo.*;
import com.project.gmaking.login.dao.LoginDAO;
import com.project.gmaking.login.vo.LoginVO;
import com.project.gmaking.security.JwtTokenProvider;
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
    private final LoginDAO loginDAO;
    private final JwtTokenProvider jwtTokenProvider;

    public CharacterServiceSdImpl(
            ClassificationService classificationService,
            StableDiffusionService sdService,
            GcsService gcsService,
            CharacterDAO characterDAO,
            LoginDAO loginDAO,
            JwtTokenProvider jwtTokenProvider) {

        this.classificationService = classificationService;
        this.sdService = sdService;
        this.gcsService = gcsService;
        this.characterDAO = characterDAO;
        this.loginDAO = loginDAO;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    @Transactional
    public Mono<CharacterGenerateResponseVO> generateCharacter(CharacterGenerateRequestVO requestVO, String userId) throws IOException {

        // 1. 이미지 분류 (FastAPI 호출)
        Mono<String> animalMono = classificationService.classifyImage(requestVO.getImage());

        return animalMono.flatMap(predictedAnimal -> {

            // 2. Stable Diffusion 프롬프트 조합
            String basePrompt = createPrompt(predictedAnimal); // , requestVO.getUserPrompt());
            String negativePrompt = "blurry, realistic, photo, 3d render, lowres, cropped, text, background, extra limbs, deformed, noise, bad pixel";

            // 3. Stable Diffusion 요청 VO 생성
            StableDiffusionRequestVO sdRequest = StableDiffusionRequestVO.builder()
                    .prompt(basePrompt)
                    .negative_prompt(negativePrompt)
                    .steps(35)
                    .width(512)
                    .height(512)
                    .cfg_scale(7.0)
                    .sampler_index("DPM++ 2M")
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

                    // 6. TB_USER 업데이트
                    String imageUrl = imageResponse.getFileUrl();
                    loginDAO.updateUserCharacterInfo(userId, imageUrl);

                    // 7. 최신 사용자 정보 조회 및 새 토큰 생성 (NEW)
                    LoginVO updatedUser = loginDAO.selectUserById(userId);
                    String newToken = jwtTokenProvider.createToken(
                            updatedUser.getUserId(),
                            updatedUser.getRole(),
                            updatedUser.getUserNickname(),
                            updatedUser.isHasCharacter(),
                            updatedUser.getCharacterImageUrl()
                    );

                    // 8. 응답 VO 생성: characterId를 포함하여 최종 응답 빌드
                    return Mono.just(CharacterGenerateResponseVO.builder()
                            .characterId(characterId) // Character ID 포함
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

    /**
     * 분류 결과와 사용자 입력을 결합하여 최종 프롬프트를 생성

    private String createPrompt(String predictedAnimal) { // , String userPrompt) {
        String style = """
            highly detailed 2d pixel art of a fantasy game character, clean sprite sheet style,
            full body, isolated on transparent background, perfect pixel alignment,
            vibrant colors, smooth edges, masterpiece, trending on artstation, sharp details
        """;

        return String.format("%s, %s, 2d pixel, game character", predictedAnimal, style); // userPrompt);
    }
    */

    private String createPrompt(String predictedAnimal) {
        String positivePrompt = String.format("""
                %s character, cute %s warrior, full body, facing forward,
                2d pixel art, 16-bit style, game sprite, professional pixel character design,
                clean edges, detailed shading, vibrant colors, smooth pixels, high quality, masterpiece
                """, predictedAnimal, predictedAnimal);

        String negativePrompt = """
                blurry, realistic, photo, 3d render, lowres, bad anatomy, cropped,
                text, watermark, signature, background, shadow, extra limbs, deformed, noise, bad pixel
                """;

        // StableDiffusionRequestVO 쪽에서 negative_prompt 필드를 지원한다면 여기서 함께 세팅 가능
        return positivePrompt + " --neg " + negativePrompt;
    }
}