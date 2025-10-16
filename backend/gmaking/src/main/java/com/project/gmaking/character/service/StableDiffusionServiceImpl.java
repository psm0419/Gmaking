package com.project.gmaking.character.service;

import com.project.gmaking.character.service.StableDiffusionService;
import com.project.gmaking.character.vo.StableDiffusionRequestVO;
import com.project.gmaking.character.vo.StableDiffusionResponseVO;
import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
public class StableDiffusionServiceImpl implements StableDiffusionService {

    @Value("${sd.api.url}")
    private String sdApiUrl; // http://127.0.0.1:7860

    private final WebClient webClient;

    public StableDiffusionServiceImpl(@Value("${sd.api.url}") String sdApiUrl) {
        this.sdApiUrl = sdApiUrl;

        // 이미지 크기 20MB 설정
        ExchangeStrategies strategies = ExchangeStrategies.builder()
                .codecs(configurer -> configurer
                        .defaultCodecs()
                        .maxInMemorySize(20 * 1024 * 1024))
                .build();

        // WebClient 생성 + 타임아웃 15분 설정
        this.webClient = WebClient.builder()
                .baseUrl(sdApiUrl)
                .clientConnector(new ReactorClientHttpConnector(
                        HttpClient.create()
                                .responseTimeout(Duration.ofMinutes(15))
                ))
                .exchangeStrategies(strategies)
                .build();
    }

    public String generateImage(Map<String, Object> requestBody) {
        try {
            return webClient.post()
                    .uri(sdApiUrl + "/sdapi/v1/txt2img")
                    .header("Content-Type", "application/json")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
        } catch (Exception e) {
            throw new RuntimeException("Stable Diffusion API 통신 오류: " + e.getMessage(), e);
        }
    }

    /**
     * Stable Diffusion API를 호출하여 이미지를 생성하고 Base64 데이터를 반환
     * @param requestVO API 요청 바디
     * @return Base64 이미지 데이터 리스트 (Mono)
     */
    public Mono<List<String>> generateImage(StableDiffusionRequestVO requestVO) {
        return webClient.post()
                // 절대 경로 지정
                .uri(sdApiUrl + "/sdapi/v1/txt2img") // sdApiUrl = http://127.0.0.1:7860
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestVO)
                .retrieve()
                .bodyToMono(StableDiffusionResponseVO.class)
                .map(response -> response.getImages())
                .onErrorResume(e -> {
                    System.err.println("Stable Diffusion API 통신 오류: " + e.getMessage());
                    return Mono.error(new RuntimeException("캐릭터 이미지 생성에 실패했습니다."));
                });
    }
}