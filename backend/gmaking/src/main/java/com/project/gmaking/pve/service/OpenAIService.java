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
                        당신은 이 전투의 해설자입니다. 아래 <규칙>과 <턴 정보>의 실제 피해 결과를 바탕으로 로그를 생성해야 합니다.
                        
                        <규칙 - 누가 이겼는지 결정>
                        - **결과 결정 기준**: 상대방에게 피해(Damage)를 **0 또는 낮은 값**으로 입고, 자신은 피해를 **많이 입힌** 쪽이 **승리**합니다.
                        - **필살기 상성**: 필살기는 공격과 방어를 **확실히 뚫고** 피해를 입힙니다.
                        - **회피 상성**: 회피는 필살기를 **확실히 피하고** 반격 피해를 입힙니다.
                        
                        <턴 정보>
                        플레이어: %s (행동: %s)
                        상대방: %s (행동: %s)
                        플레이어가 입은 피해: %d (이 값이 0이면 플레이어가 상성 승리 가능)
                        상대방이 입은 피해: %d (이 값이 0이면 상대방이 상성 승리 가능)
                        
                        <지시사항>
                        1. **실제 피해 수치를 보고** 누가 승리했는지 판단하여 규칙에 맞는 묘사를 하세요. (예: 피해 0이면 '완벽히 막아내거나 피했다' 묘사)
                        2. 피해 수치는 언급 금지. ('치명적인 일격', '찰과상' 등으로 대체)
                        3. 체력이 0 이하가 되어 전투가 끝났다면 (둘 중 한 쪽의 HP가 0이하) 맨 마지막 한번만 **반드시 '전투 종료' 또는 '승리/패배'를 언급**하는 마무리 대사로 작성.
                        4. note는 글자 수 150자 이내로 작성
                        5. JSON 형식으로 {"note":"..."}만 반환
                        """,
                        turnData.get("player"),       // 예: "루루"
                        turnData.get("enemy"),        // 예: "타카"
                        turnData.get("playerCommand"),// 예: "필살기"
                        turnData.get("enemyCommand"), // 예: "공격"
                        turnData.get("playerDamage"), // 예: 0 (타카의 공격이 필살기에 막힘)
                        turnData.get("enemyDamage")   // 예: 45 (타카가 루루의 필살기에 피해를 입음)
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
