package com.project.gmaking.character.ai;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Component
@RequiredArgsConstructor
@SuppressWarnings("unchecked")
public class BackgroundAi {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${openai.api.key}")
    private String apiKey;

    // 간단한 텍스트 생성용 메서드
    public String generateCharacterBackground(String characterName, String predictedAnimal, int personalityId) {
        String url = "https://api.openai.com/v1/chat/completions";

        String personalityDesc = switch (personalityId) {
            case 1 -> "장난스러운 성격";
            case 2 -> "진중한 성격";
            case 3 -> "우울한 성격";
            default -> "평범한 성격";
        };

        Map<String, Object> body = new HashMap<>();
        body.put("model", "gpt-4o-mini");

        List<Map<String, String>> messages = List.of(
                Map.of("role", "system", "content", "너는 게임 캐릭터 설정 작가야."),
                Map.of("role", "user", "content",
                        "다음 정보를 바탕으로 간단한 배경 스토리를 만들어줘.\n" +
                                "- 캐릭터 이름: " + characterName + "\n" +
                                "- 동물 타입: " + predictedAnimal + "\n" +
                                "- 성격: " + personalityDesc + "\n" +
                                "게임 내 캐릭터 설정용으로 2~3문장 정도의 간결한 스토리로 써줘.")
        );

        body.put("messages", messages);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, request, Map.class);
        List<Map<String, Object>> choices = (List<Map<String, Object>>) response.getBody().get("choices");
        if (choices != null && !choices.isEmpty()) {
            Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
            return (String) message.get("content");
        }
        return "이 캐릭터는 " + predictedAnimal + "의 특징을 가진 특별한 존재입니다.";
    }
}
