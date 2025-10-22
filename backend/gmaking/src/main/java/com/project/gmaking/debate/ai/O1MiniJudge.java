// src/main/java/com/project/gmaking/debate/ai/O1MiniJudge.java
package com.project.gmaking.debate.ai;

import com.project.gmaking.debate.vo.DebateLineVO;
import com.project.gmaking.debate.vo.JudgeResultVO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class O1MiniJudge implements Judge {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${openai.api.key}")
    private String apiKey;

    // 기본값 o1-mini
    @Value("${openai.reasoner.model:o1-mini}")
    private String model;

    @Override
    public String name() {
        return "gpt-o1-mini";
    }

    @SuppressWarnings("unchecked")
    @Override
    public JudgeResultVO judge(String topic, List<DebateLineVO> dialogue) {
        // 대화 문자열 구성
        String conv = dialogue.stream()
                .map(d -> d.getSpeaker() + ": " + d.getLine())
                .collect(Collectors.joining("\n"));

        // o1-mini는 system 프롬프트 미지원 → 모든 내용을 user 메시지로 통합
        String prompt = """
                너는 말싸움 심사위원이다. 논리·개성·표현력을 기준으로 반드시 한 명의 승자를 고르고, 그 이유를 한 문장으로 요약하라. 무승부 금지.
                
                주제: %s
                대화:
                %s
                출력(JSON만):
                {"winner":"<캐릭터명>","comment":"<이유 한 문장>"}
                """.formatted(topic, conv);

        try {
            String url = "https://api.openai.com/v1/chat/completions";

            Map<String, Object> body = new HashMap<>();
            body.put("model", model);
            body.put("messages", List.of(Map.of("role", "user", "content", prompt)));

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(apiKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            ResponseEntity<Map<String, Object>> res = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    new ParameterizedTypeReference<>() {}
            );

            Map<String, Object> bodyMap = res.getBody();
            if (bodyMap == null || !bodyMap.containsKey("choices")) {
                return new JudgeResultVO("UNKNOWN", "o1-mini 응답 없음");
            }

            List<Map<String, Object>> choices = (List<Map<String, Object>>) bodyMap.get("choices");
            if (choices.isEmpty()) {
                return new JudgeResultVO("UNKNOWN", "o1-mini choices 비어있음");
            }

            Map<String, Object> first = choices.get(0);
            Map<String, Object> message = (Map<String, Object>) first.get("message");
            String content = message != null ? (String) message.get("content") : null;
            if (content == null || content.isBlank()) {
                return new JudgeResultVO("UNKNOWN", "o1-mini content 비어있음");
            }

            // JSON 필드 추출
            String winner = extract(content, "winner");
            String comment = extract(content, "comment");
            if (winner.isBlank()) winner = "UNKNOWN";
            if (comment.isBlank()) comment = "형식 파싱 실패";

            return new JudgeResultVO(winner, comment);

        } catch (Exception e) {
            e.printStackTrace();
            return new JudgeResultVO("UNKNOWN", "o1-mini 호출 실패");
        }
    }

    // 단순 JSON 문자열 파싱용 유틸
    private String extract(String text, String key) {
        try {
            int s = text.indexOf("\"" + key + "\"");
            if (s < 0) return "";
            int q1 = text.indexOf("\"", text.indexOf(":", s) + 1);
            int q2 = text.indexOf("\"", q1 + 1);
            if (q1 < 0 || q2 < 0) return "";
            return text.substring(q1 + 1, q2);
        } catch (Exception e) {
            return "";
        }
    }
}
