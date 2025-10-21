//package com.project.gmaking.debate.ai;
//
//import com.project.gmaking.debate.vo.DebateLineVO;
//import com.project.gmaking.debate.vo.JudgeResultVO;
//import lombok.RequiredArgsConstructor;
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.http.*;
//import org.springframework.stereotype.Component;
//import org.springframework.web.client.RestTemplate;
//
//import java.util.List;
//import java.util.Map;
//import java.util.stream.Collectors;
//
//@Component
//@RequiredArgsConstructor
//public class ClaudeJudge implements Judge {
//
//    @Value("${claude.api.key}")
//    private String claudeKey;
//
//    private final RestTemplate restTemplate = new RestTemplate();
//
//    @Override
//    public String name() { return "claude"; }
//
//    @Override
//    public JudgeResultVO judge(String topic, List<DebateLineVO> dialogue) {
//        String url = "https://api.anthropic.com/v1/messages";
//
//        // 대화 내용 문자열로 변환
//        String conv = dialogue.stream()
//                .map(d -> d.getSpeaker() + ": " + d.getLine())
//                .collect(Collectors.joining("\n"));
//
//        String system = "너는 AI 심사위원이다. 창의성과 표현력을 중시하며 반드시 한 명의 승자를 고르고 이유를 한 문장으로 말하라. 무승부는 금지.";
//        String prompt = """
//                주제: %s
//                대화:
//                %s
//
//                결과는 다음 JSON 형식으로만 출력하라:
//                {"winner":"<캐릭터명>","comment":"<이유 한 문장>"}
//                """.formatted(topic, conv);
//
//        // Anthropic Claude 요청 JSON
//        Map<String, Object> body = Map.of(
//                "model", "claude-3-haiku-20240307",  // 무료·저가형 모델
//                "max_tokens", 200,
//                "system", system,
//                "messages", List.of(Map.of("role", "user", "content", prompt))
//        );
//
//        HttpHeaders headers = new HttpHeaders();
//        headers.setContentType(MediaType.APPLICATION_JSON);
//        headers.set("x-api-key", claudeKey);
//        headers.set("anthropic-version", "2023-06-01");
//
//        ResponseEntity<Map> res = restTemplate.exchange(
//                url, HttpMethod.POST, new HttpEntity<>(body, headers), Map.class
//        );
//
//        try {
//            // Claude 응답 파싱
//            List content = (List) res.getBody().get("content");
//            Map first = (Map) content.get(0);
//            String text = (String) first.get("text");
//
//            return new JudgeResultVO(extract(text, "winner"), extract(text, "comment"));
//        } catch (Exception e) {
//            e.printStackTrace();
//            return new JudgeResultVO("UNKNOWN", "판정 실패");
//        }
//    }
//
//    // JSON 텍스트에서 key 추출
//    private String extract(String text, String key) {
//        try {
//            int s = text.indexOf("\"" + key + "\"");
//            int q1 = text.indexOf("\"", text.indexOf(":", s) + 1);
//            int q2 = text.indexOf("\"", q1 + 1);
//            return text.substring(q1 + 1, q2);
//        } catch (Exception e) {
//            return "";
//        }
//    }
//}
