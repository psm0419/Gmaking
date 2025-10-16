package com.project.gmaking.character.service;

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

@Service
public class ClassificationServiceImpl implements ClassificationService {

    private final WebClient webClient;
    private String modelServerUrl;

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
                .map(ClassificationResponseVO::getPredictedAnimal)
                .onErrorResume(e -> {
                    String errorMessage = String.format("모델 서버 통신 오류: %s. 엔드포인트: /classify/image", e.getMessage());
                    System.err.println(errorMessage);
                    return Mono.error(new RuntimeException("이미지 분류 서버에 연결할 수 없거나 응답이 잘못되었습니다. (설정값 확인 요망)"));
                });
    }

}