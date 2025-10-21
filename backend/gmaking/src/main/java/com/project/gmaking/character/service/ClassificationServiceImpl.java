package com.project.gmaking.character.service;

import com.project.gmaking.character.exception.ClassificationFailedException;
import com.project.gmaking.character.service.ClassificationService;
import com.project.gmaking.character.vo.ClassificationResponseVO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import reactor.netty.http.client.HttpClient;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.util.Set;

@Service
public class ClassificationServiceImpl implements ClassificationService {

    private final WebClient webClient;
    private String modelServerUrl;

    // 임계값 설정
    @Value("${classification.threshold:0.80}")
    private double confidenceThreshold;
    private static final Set<String> ALLOWED_ANIMALS = Set.of("bear", "eagle", "penguin", "turtle");

    public ClassificationServiceImpl(
            WebClient.Builder webClientBuilder,
            @Value("${model.server.url}") String modelServerUrl
    ) {
        this.modelServerUrl = modelServerUrl;

        // 3. WebClient 타임아웃 설정
        HttpClient httpClient = HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 120000) // 2분 연결 타임아웃
                .doOnConnected(conn ->
                        conn.addHandlerLast(new ReadTimeoutHandler(120)) // 2분 읽기 타임아웃 (초 단위)
                );

        this.webClient = webClientBuilder
                .baseUrl(this.modelServerUrl) // 저장된 modelServerUrl 사용
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .build();
    }


    @Override
    public Mono<String> classifyImage(MultipartFile imageFile) throws IOException {

        org.springframework.http.client.MultipartBodyBuilder builder = new org.springframework.http.client.MultipartBodyBuilder();

        builder.part("file", imageFile.getResource());

        // FastAPI 서버의 엔드포인트로 요청 전송
        return webClient.post()
                .uri("/classify/image")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(builder.build()))
                .retrieve()
                .bodyToMono(ClassificationResponseVO.class)
                .flatMap(response -> { // map 대신 flatMap을 사용하여 비즈니스 로직 처리
                    String predictedAnimal = response.getPredictedAnimal().toLowerCase();
                    double confidence = response.getConfidence();

                    // 정확도 검증
                    if (confidence < confidenceThreshold) {
                        System.err.printf("[CLASSIFY FAILED] 낮은 정확도. 예측: %s, 확신도: %.4f%n", predictedAnimal, confidence);
                        return Mono.error(new ClassificationFailedException(
                                String.format("이미지 분류 정확도(%.1f%%)가 낮아 캐릭터를 생성할 수 없습니다. 다른 이미지를 시도해 주세요.", confidence * 100)
                        ));
                    }

//                    // 허용된 동물 목록 검증
//                    if (!ALLOWED_ANIMALS.contains(predictedAnimal)) {
//                        System.err.printf("[CLASSIFY FAILED] 허용되지 않은 동물. 예측: %s, 확신도: %.4f%n", predictedAnimal, confidence);
//                        return Mono.error(new ClassificationFailedException(
//                                String.format("'%s'이(가) 아닌 곰, 독수리, 펭귄, 거북이 중 하나의 이미지만 업로드할 수 있습니다.", predictedAnimal)
//                        ));
//                    }

                    // 모든 검증 통과 시, 예측된 동물 이름 반환
                    System.out.printf("[CLASSIFY SUCCESS] 예측: %s, 확신도: %.4f%n", predictedAnimal, confidence);
                    return Mono.just(predictedAnimal);
                })
                .onErrorResume(e -> {
                    if (e instanceof ClassificationFailedException) {
                        return Mono.error(e); // 비즈니스 예외는 그대로 Controller로 전달
                    }

                    String errorMessage = String.format("모델 서버 통신 오류: %s. 엔드포인트: /classify/image", e.getMessage());
                    System.err.println(errorMessage);
                    return Mono.error(new RuntimeException("이미지 분류 서버에 연결할 수 없거나 응답이 잘못되었습니다. (설정값 확인 요망)"));
                });
    }

}