package com.project.gmaking.character.service;

import reactor.core.publisher.Mono;

import java.util.List;

public interface GptImageService {

    /**
     * 분류 결과와 사용자 프롬프트를 기반으로 GPT API (DALL-E)를 호출하여 이미지를 생성
     * @param predictedAnimal ResNet 분류 결과 (예: "penguin")
     * @param characterName 생성할 캐릭터 이름
     * @param userPrompt 사용자가 입력한 추가 프롬프트
     * @return Base64 인코딩된 이미지 데이터 리스트 (Mono)
     */
    Mono<List<String>> generateImage(String predictedAnimal, String characterName, String userPrompt);
}