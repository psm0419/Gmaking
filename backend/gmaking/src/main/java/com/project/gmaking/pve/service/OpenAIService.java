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
     * PVE 비동기 note 생성 (damage, critical 반영)
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

    /**
     * 비동기 PVP 턴 결과 요약 생성 (커맨드, 피해 반영)
     */
    public CompletableFuture<String> requestGPTPvpNote(Map<String, Object> turnData) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                String apiKey = System.getenv("OPENAI_API_KEY");
                if (apiKey == null) throw new IllegalStateException("OPENAI_API_KEY 없음");

                // PVP 상황에 맞게 프롬프트와 입력 데이터를 수정합니다.
                String prompt = String.format("""
                        한 턴 PVP 전투에 대한 무협지스러운 note를 생성하세요.
                        당신은 이 전투의 해설자입니다. 아래 <규칙>, <턴 정보>를 **절대적으로 따라** 로그를 생성해야 합니다.
                        
                        <규칙>
                        - **행동 기반 묘사**: 플레이어 행동(%s)과 상대방 행동(%s)을 **반드시 그대로 묘사에 포함**하여 상호작용을 설명하세요. (예: '루루는 필살기를 시전하며', '가나는 방어 자세를 취했다')
                        - **승패 결정**: 피해량 (0 또는 낮은 값 vs 높은 값)과 남은 HP를 기준으로 판단합니다.
                        - **피해 수치**: 절대 언급 금지. ('치명적인 일격', '찰과상', '무위로 돌아감' 등으로 대체)
                        
                        <턴 정보>
                        플레이어: %s (행동: %s)
                        상대방: %s (행동: %s)
                        플레이어 (턴 종료 후 남은) HP: %d
                        상대방 (턴 종료 후 남은) HP: %d
                        플레이어가 입은 피해: %d
                        상대방이 입은 피해: %d
                        
                        <지시사항>
                        1. **가장 중요**: 플레이어의 행동(%s)과 상대방의 행동(%s)을 묘사에 **필수적으로 포함**하세요.
                        2. 피해 수치와 HP 수치는 언급 금지.
                        3. 플레이어나 상대방 중 누군가의 HP가 **0 이하**라면, 맨 마지막에 **반드시 '전투 종료'와 승패를 언급**하세요. HP가 남아있다면 **'전투는 계속된다'**는 뉘앙스로 마무리하세요.
                        4. note는 글자 수 150자 이내로 작성
                        5. JSON 형식으로 {"note":"..."}만 반환
                        """,
                        turnData.get("playerCommand"), // 1. 규칙 내의 행동 기반 묘사에 사용
                        turnData.get("enemyCommand"),  // 2. 규칙 내의 행동 기반 묘사에 사용
                        turnData.get("player"),
                        turnData.get("playerCommand"),
                        turnData.get("enemy"),
                        turnData.get("enemyCommand"),
                        turnData.get("playerHp"),
                        turnData.get("enemyHp"),
                        turnData.get("playerDamage"),
                        turnData.get("enemyDamage"),
                        turnData.get("playerCommand"), // 3. 지시사항 1에 사용
                        turnData.get("enemyCommand")   // 4. 지시사항 1에 사용
                );

                Map<String, Object> body = Map.of(
                        "model", MODEL,
                        "messages", List.of(
                                Map.of("role", "system", "content", "You are a PVP combat narrator who focuses on action and command interaction."),
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
