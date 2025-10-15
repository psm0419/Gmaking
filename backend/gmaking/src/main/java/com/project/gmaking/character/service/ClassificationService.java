package com.project.gmaking.character.service;

import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Mono;
import java.io.IOException;

public interface ClassificationService {

    /**
     * FastAPI 모델 서버에 이미지를 전송하고 분류 결과를 받음
     * @param imageFile 프론트에서 받은 이미지 파일
     * @return 예측된 동물 이름 (예: "bear", "eagle")을 포함하는 Mono<String>
     */
    Mono<String> classifyImage(MultipartFile imageFile) throws IOException;
}