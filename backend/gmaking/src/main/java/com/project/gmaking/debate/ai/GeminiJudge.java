package com.project.gmaking.debate.ai;

import com.project.gmaking.debate.vo.DebateLineVO;
import com.project.gmaking.debate.vo.JudgeResultVO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class GeminiJudge implements Judge {

    @Value("${gemini.api.key}")
    private String geminiKey;

    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent}")
    private String geminiUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public String name() { return "gemini"; }

    @Override
    public JudgeResultVO judge(String topic, List<DebateLineVO> dialogue) {
        String url = geminiUrl + "?key=" + geminiKey;

        String conv = dialogue.stream()
                .map(d -> d.getSpeaker() + ": " + d.getLine())
                .collect(Collectors.joining("\n"));

        String prompt = """
            너는 감정과 표현력을 중시하는 심사위원이다.
            아래 대화를 보고 승자와 이유(한 문장)를 JSON 형식으로 출력하라.
            {"winner":"<캐릭터명>","comment":"<이유>"}
            무승부 금지.

            주제: %s
            대화:
            %s
            """.formatted(topic, conv);

        // ✅ Gemini 2.0 Flash 요청 형식 (v1 API 기준)
        Map<String, Object> req = Map.of(
                "contents", List.of(
                        Map.of(
                                "role", "user",
                                "parts", List.of(Map.of("text", prompt))
                        )
                )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        ResponseEntity<Map> res = restTemplate.exchange(
                url, HttpMethod.POST,
                new HttpEntity<>(req, headers),
                Map.class
        );

        try {
            // Gemini v1 응답 구조
            List candidates = (List) res.getBody().get("candidates");
            Map first = (Map) candidates.get(0);
            Map content = (Map) first.get("content");
            List parts = (List) content.get("parts");
            Map p = (Map) parts.get(0);
            String text = (String) p.get("text");

            return new JudgeResultVO(extract(text, "winner"), extract(text, "comment"));
        } catch (Exception e) {
            e.printStackTrace();
            return new JudgeResultVO("UNKNOWN", "평가 실패");
        }
    }

    private String extract(String text, String key) {
        try {
            int s = text.indexOf("\"" + key + "\"");
            int q1 = text.indexOf("\"", text.indexOf(":", s) + 1);
            int q2 = text.indexOf("\"", q1 + 1);
            return text.substring(q1 + 1, q2);
        } catch (Exception e) {
            return "";
        }
    }
}
