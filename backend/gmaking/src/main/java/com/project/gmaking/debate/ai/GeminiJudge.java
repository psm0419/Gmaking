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
@SuppressWarnings("unchecked") // 경고 제거
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

        // 대화 내용 연결
        String conv = dialogue.stream()
                .map(d -> d.getSpeaker() + ": " + d.getLine())
                .collect(Collectors.joining("\n"));

        // 프롬프트 생성
        String prompt = """
            너는 감정과 표현력을 중시하는 심사위원이다.
            아래 대화를 보고 승자와 이유(한 문장)를 JSON 형식으로 출력하라.
            {"winner":"<캐릭터명>","comment":"<이유>"}
            무승부 금지.

            주제: %s
            대화:
            %s
            """.formatted(topic, conv);

        // Gemini 2.0 Flash 요청 형식
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

        try {
            // 응답 요청
            ResponseEntity<Map<String, Object>> res = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    new HttpEntity<>(req, headers),
                    (Class<Map<String, Object>>)(Class<?>)Map.class
            );

            Map<String, Object> body = res.getBody();
            if (body == null || !body.containsKey("candidates")) {
                return new JudgeResultVO("UNKNOWN", "Gemini 응답 본문 없음");
            }

            List<Map<String, Object>> candidates = (List<Map<String, Object>>) body.get("candidates");
            if (candidates == null || candidates.isEmpty()) {
                return new JudgeResultVO("UNKNOWN", "Gemini 응답 후보 없음");
            }

            Map<String, Object> first = candidates.get(0);
            Map<String, Object> content = (Map<String, Object>) first.get("content");
            if (content == null || !content.containsKey("parts")) {
                return new JudgeResultVO("UNKNOWN", "Gemini content 구조 이상");
            }

            List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
            if (parts == null || parts.isEmpty()) {
                return new JudgeResultVO("UNKNOWN", "Gemini parts 비어있음");
            }

            Map<String, Object> p = parts.get(0);
            String text = (String) p.get("text");
            if (text == null || text.isBlank()) {
                return new JudgeResultVO("UNKNOWN", "Gemini text 비어있음");
            }

            return new JudgeResultVO(
                    extract(text, "winner"),
                    extract(text, "comment")
            );

        } catch (Exception e) {
            e.printStackTrace();
            return new JudgeResultVO("UNKNOWN", "Gemini 호출 실패");
        }
    }

    private String extract(String text, String key) {
        try {
            int s = text.indexOf("\"" + key + "\"");
            if (s < 0) return "";
            int q1 = text.indexOf("\"", text.indexOf(":", s) + 1);
            int q2 = text.indexOf("\"", q1 + 1);
            return text.substring(q1 + 1, q2);
        } catch (Exception e) {
            return "";
        }
    }
}
