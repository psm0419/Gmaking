package com.project.gmaking.pve.service;

import java.net.http.*;
import java.net.URI;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class OpenAIService {

    private static final String API_URL = "https://api.openai.com/v1/chat/completions";
    private static final String MODEL = "gpt-4o-mini";
    private static final ObjectMapper mapper = new ObjectMapper();
    private final HttpClient client = HttpClient.newHttpClient();

    /**
     * 비동기 note 생성 (damage, critical 반영)
     */
    public CompletableFuture<String> requestGPTNote(Map<String, Object> turnData) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                String apiKey = System.getenv("OPENAI_API_KEY");
                if (apiKey == null) throw new IllegalStateException("OPENAI_API_KEY 없음");

                String prompt = String.format("""
                                한 턴 전투에 대한 코믹한 note를 생성하세요.
                                아래 조건을 반드시 지켜서 JSON으로 출력해 주세요:
                                1. 반드시 note 필드 하나만 포함
                                2. 문자열은 큰따옴표 안에만 넣고, 코드 블록이나 다른 문법 사용 금지
                                3. 예시: {"note": "루루가 늑대를 공격했다!"}
                                공격자: %s
                                방어자: %s
                                데미지: %d
                                크리티컬: %s
                                절대 데미지 수치 언급 금지
                                체력이 0이하로 떨어지는 마지막턴은 대사가 마무리되도록 작성
                                - JSON 형식으로 {"note":"..."}만 반환
                                """,
                        turnData.get("actor"),
                        turnData.get("target"),
                        turnData.get("damage"),
                        turnData.get("critical")
                );

                Map<String, Object> body = Map.of(
                        "model", MODEL,
                        "messages", List.of(
                                Map.of("role", "system", "content", "You are a funny combat narrator."),
                                Map.of("role", "user", "content", prompt)
                        ),
                        "temperature", 0.4
                );

                String json = mapper.writeValueAsString(body);

                HttpRequest req = HttpRequest.newBuilder()
                        .uri(URI.create(API_URL))
                        .timeout(Duration.ofSeconds(30))
                        .header("Content-Type", "application/json")
                        .header("Authorization", "Bearer " + apiKey)
                        .POST(HttpRequest.BodyPublishers.ofString(json))
                        .build();

                HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());

                // **응답 로그 출력**
                System.out.println("[GPT 원본 응답] " + res.body());

                if (res.statusCode() != 200) {
                    System.err.println("[GPT 호출 실패] HTTP 상태: " + res.statusCode());
                    return "{\"note\":\"[GPT 호출 실패: HTTP 오류]\"}";
                }

                var node = mapper.readTree(res.body());
                String content = node.path("choices").get(0).path("message").path("content").asText();

                // **파싱 전 note 내용 확인**
                System.out.println("[GPT 파싱 전 note] " + content);

                return content;

            } catch (Exception e) {
                System.err.println("[GPT 호출 실패] 이유: " + e.getMessage());
                e.printStackTrace();
                return "{\"note\":\"[GPT 호출 실패: " + e.getClass().getSimpleName() + "]\"}";
            }
        });
    }
}
