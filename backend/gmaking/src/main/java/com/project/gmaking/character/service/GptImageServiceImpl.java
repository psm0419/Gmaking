package com.project.gmaking.character.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;

@Service
public class GptImageServiceImpl implements GptImageService {

    private final WebClient webClient;
    private final String gptApiKey;
    private final String gptImageModelName;

    // WebClient 설정: 이미지 생성 API는 응답 크기가 크므로 메모리 설정을 늘려야 합니다.
    public GptImageServiceImpl(
            WebClient.Builder webClientBuilder,
            @Value("${gpt.image.api.url}") String gptApiUrl,
            @Value("${gpt.api.key}") String gptApiKey,
            @Value("${gpt.image.model.name}") String gptImageModelName) {

        this.gptApiKey = gptApiKey;
        this.gptImageModelName = gptImageModelName;

        final int size = 16 * 1024 * 1024; // 16MB
        final ExchangeStrategies strategies = ExchangeStrategies.builder()
                .codecs(codecs -> codecs.defaultCodecs().maxInMemorySize(size))
                .build();

        this.webClient = webClientBuilder
                .baseUrl(gptApiUrl) // https://api.openai.com/v1/images/generations
                .exchangeStrategies(strategies)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + gptApiKey)
                .build();
    }

    @Override
    public Mono<List<String>> generateImage(String predictedAnimal, String characterName, String userPrompt) {

        // 1. DALL-E에 전달할 프롬프트 조합 (GPT-4o의 LLM 능력 활용)
        // 수정 제안 부분 (combinedPrompt 내부)
        // DALL-E에 전달할 프롬프트 조합 (GPT-4o의 LLM 능력 활용)
        String combinedPrompt = String.format("""
        **MAXIMUM FOCUS: SINGLE, ISOLATED, FULL-BODY PIXEL ART CHARACTER. ABSOLUTELY NO EXTRA ELEMENTS.**
        
        Highly detailed 2D pixel art, 16-bit style character illustration of a fantasy warrior.
        The main subject is a %s, named '%s'.
        User's specific request: %s.
        
        **STRICTLY FORBIDDEN:**
        - NO sprite sheet, NO multiple poses, NO reference images, NO concept sheet, NO item variations.
        - NO color palette, NO color swatch, NO UI elements, NO toolbars, NO brushes, NO pencils, NO text, NO watermarks.
        - NO other characters, NO other objects, NO backgrounds (MUST BE PURE WHITE BACKGROUND).
        
        Focus on a single, full-body character, centered, **PURE WHITE BACKGROUND**, vibrant colors, clean edges.
        Ensure the character is fully visible, NO cropping. The character MUST be the ONLY thing on the canvas.
    """, predictedAnimal, characterName, userPrompt != null && !userPrompt.isEmpty() ? userPrompt : "No extra details. Make it a cute warrior.");

        // 2. DALL-E API 요청 바디 구성
        GptImageRequest requestBody = GptImageRequest.builder()
                .model(gptImageModelName) // dall-e-3
                .prompt(combinedPrompt)
                .n(1)
                .size("1024x1024")
                .response_format("b64_json")
                .build();

        // 3. WebClient를 이용한 DALL-E API 호출
        return webClient.post()
                .uri("") // gpt.image.api.url 자체가 /images/generations 이므로
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(GptImageResponse.class)
                .map(response -> {
                    // DALL-E 응답에서 Base64 데이터 추출
                    return response.getData().stream()
                            .map(GptImageResponse.ImageData::getB64_json)
                            .toList();
                })
                .onErrorResume(e -> {
                    System.err.println("GPT/DALL-E API 통신 또는 이미지 생성 오류: " + e.getMessage());
                    return Mono.error(new RuntimeException("캐릭터 이미지 생성 중 오류 발생. (GPT/DALL-E API)", e));
                });
    }


    // =========================================================================
    // 내부 GPT Image API 통신용 DTO (VO)
    // =========================================================================

    // DALL-E Image Generation 요청 DTO
    @Data
    @Builder
    private static class GptImageRequest {
        private String model;
        private String prompt;
        private Integer n;
        private String size;
        private String response_format;
    }


    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class GptImageResponse {
        private List<ImageData> data;

        @Data
        @JsonIgnoreProperties(ignoreUnknown = true)
        public static class ImageData {
            @JsonProperty("b64_json")
            private String b64_json;
        }
    }
}