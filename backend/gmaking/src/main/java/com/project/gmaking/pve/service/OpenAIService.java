package com.project.gmaking.pve.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.*;
import java.time.Duration;
import java.util.*;

@Component
@RequiredArgsConstructor
public class OpenAIService {

    private static final String API_URL = "https://api.openai.com/v1/chat/completions";
    private static final String MODEL = "gpt-4o-mini"; // 모델은 비용/속도에 따라 변경 가능
    private static final ObjectMapper mapper = new ObjectMapper();

    public List<String> generateBattleLog(Map<String, Object> character, Map<String, Object> monster) {
        try {
            String apiKey = System.getenv("OPENAI_API_KEY");
            if (apiKey == null) {
                throw new IllegalStateException("OPENAI_API_KEY 환경변수가 설정되지 않았습니다.");
            }

            // GPT 프롬프트
            String prompt = String.format("""
                두 전투자의 스탯을 기반으로 턴제 전투를 시뮬레이션하세요.
                속도가 높은 쪽이 선공합니다.
                전투는 한쪽 HP가 0 이하가 되면 종료됩니다.
                JSON 배열 형태로 결과를 출력하세요. 각 턴은 아래 형식을 따라야 합니다:

                [
                  {"turn":1, "actor":"플레이어", "action":"공격", "damage":15, "monsterHp":85, "playerHp":100, "note":null},
                  ...
                ]

                플레이어: %s
                몬스터: %s
                """, mapper.writeValueAsString(character), mapper.writeValueAsString(monster));

            // 요청 메시지 구조
            var messages = List.of(
                    Map.of("role", "system", "content", "You are a game combat simulator."),
                    Map.of("role", "user", "content", prompt)
            );

            var body = Map.of(
                    "model", MODEL,
                    "messages", messages,
                    "temperature", 0.3
            );

            String json = mapper.writeValueAsString(body);

            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(API_URL))
                    .timeout(Duration.ofSeconds(30))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();

            HttpClient client = HttpClient.newHttpClient();
            HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());

            var node = mapper.readTree(res.body());
            String content = node.path("choices").get(0).path("message").path("content").asText();

            // JSON 배열만 추출
            int start = content.indexOf('[');
            int end = content.lastIndexOf(']');
            if (start == -1 || end == -1) throw new RuntimeException("응답에서 JSON 배열을 찾지 못했습니다.");
            String jsonArray = content.substring(start, end + 1);

            // JSON → List<String> 변환 (턴 로그만 추출)
            var turns = mapper.readValue(jsonArray, new TypeReference<List<Map<String, Object>>>() {});
            List<String> logs = new ArrayList<>();
            for (Map<String, Object> t : turns) {
                logs.add(String.format(
                        "턴 %d: %s가 %s으로 %d 데미지를 입힘 (플레이어HP:%s, 몬스터HP:%s)",
                        ((Number)t.get("turn")).intValue(),
                        t.get("actor"),
                        t.get("action"),
                        ((Number)t.get("damage")).intValue(),
                        t.get("playerHp"),
                        t.get("monsterHp")
                ));
            }

            return logs;

        } catch (Exception e) {
            e.printStackTrace();
            return List.of("GPT 전투 로그 생성 실패: " + e.getMessage());
        }
    }
}
