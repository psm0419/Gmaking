package com.project.gmaking.chat.llm;

import com.google.genai.errors.ApiException;
import java.util.concurrent.ThreadLocalRandom;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.genai.Client;
import com.google.genai.types.Content;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.HttpOptions;
import com.google.genai.types.Part;
import com.project.gmaking.chat.constant.DialogueSender;
import com.project.gmaking.chat.vo.DialogueVO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
public class GeminiClientSdkImpl implements LlmClient {

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.model.name:gemini-2.0-flash}")
    private String modelName;

    private final ObjectMapper om = new ObjectMapper();

    /** .env의 키 사용 */
    private Client buildClient() {
        if (apiKey == null || apiKey.isBlank()) {
            // 여기까지 오면 .env 로드/WD 문제이므로 명확히 터뜨려 원인 노출
            throw new IllegalStateException(
                    "Gemini API key is missing. Check 'gemini.api.key' or env 'GEMINI_API_KEY'."
            );
        }
        return Client.builder()
                .apiKey(apiKey)
                .httpOptions(HttpOptions.builder().apiVersion("v1").build())
                .build();
    }

    @Override
    public String chat(String systemPrompt, String userMessage) throws Exception {
        return chatWithHistory(systemPrompt, List.of(), userMessage);
    }

    @Override
    public String chatWithHistory(String systemPrompt,
                                  List<DialogueVO> historyChrono,
                                  String latestUserMessage) throws Exception {
        Client client = buildClient();
        List<Content> contents = new ArrayList<>();

        // 0) 시스템 프롬프트(선행 user 역할로 전달)
        if (systemPrompt != null && !systemPrompt.isBlank()) {
            contents.add(
                    Content.builder()
                            .role("user")
                            .parts(List.of(Part.fromText("[SYSTEM INSTRUCTION]\n" + systemPrompt)))
                            .build()
            );
        }

        // 1) 과거 히스토리 (오래된 → 최신)
        if (historyChrono != null && !historyChrono.isEmpty()) {
            for (DialogueVO d : historyChrono) {
                String role = (d.getSender() == DialogueSender.USER) ? "user" : "model";
                String text = d.getContent() == null ? "" : d.getContent();
                if (text.isBlank()) continue;

                contents.add(
                        Content.builder()
                                .role(role)
                                .parts(List.of(Part.fromText(text)))
                                .build()
                );
            }
        }

        // 2) 이번 유저 발화
        contents.add(
                Content.builder()
                        .role("user")
                        .parts(List.of(Part.fromText(latestUserMessage)))
                        .build()
        );

        // 3) 모델 호출
        GenerateContentResponse res = withRetry(
                () -> client.models.generateContent(modelName, contents, null),
                "chatWithHistory:" + modelName
        );
        String text = res.text();

        LlmContext.set(modelName);

        return (text == null || text.isBlank()) ? "빈 응답입니다." : text.trim();
    }

    // ===========================
    // 요약/장기기억 "주입" 버전 (새로 추가)
    // ===========================
    /**
     * 롤링요약(conversationSummary)과 장기기억(memories)을 프리픽스 컨텍스트로 주입한 뒤 대화 호출.
     * 기존 chat/chatWithHistory를 건드리지 않고, 서비스단에서 선택적으로 이 메서드를 사용.
     */
    public String chatWithMemory(String systemPrompt,
                                 String conversationSummary,          // 롤링 요약 (nullable)
                                 List<MemoryItem> memories,           // 장기기억 (nullable)
                                 List<DialogueVO> historyChrono,
                                 String latestUserMessage) throws Exception {
        Client client = buildClient();
        List<Content> contents = new ArrayList<>();

        // 0) 시스템 프롬프트
        if (notBlank(systemPrompt)) {
            contents.add(Content.builder()
                    .role("user")
                    .parts(List.of(Part.fromText("[SYSTEM INSTRUCTION]\n" + systemPrompt)))
                    .build());
        }

        // 0.5) 메모리 컨텍스트 프리픽스
        StringBuilder memBuf = new StringBuilder();
        if (notBlank(conversationSummary)) {
            memBuf.append("## CONVERSATION_SUMMARY\n")
                    .append(trimTo(conversationSummary, 1200)).append("\n\n");
        }
        if (memories != null && !memories.isEmpty()) {
            memBuf.append("## LONG_TERM_MEMORIES (user-authored only)\n");
            for (MemoryItem m : limit(memories, 6)) { // 과도한 주입 방지
                memBuf.append("- [").append(nz(m.category())).append("] ")
                        .append(nz(m.subject())).append(" : ")
                        .append(trimTo(nz(m.value()), 180));
                if (notBlank(m.dueAt())) {
                    memBuf.append(" (due: ").append(m.dueAt()).append(")");
                }
                memBuf.append("\n");
            }
            memBuf.append("\n사용자 선호/일정은 참고용이며, **사실로 단정하지 말고** 맥락에 맞게만 활용하세요.\n");
        }
        if (memBuf.length() > 0) {
            contents.add(Content.builder()
                    .role("user")
                    .parts(List.of(Part.fromText("[MEMORY CONTEXT]\n" + memBuf)))
                    .build());
        }

        // 1) 과거 히스토리
        if (historyChrono != null && !historyChrono.isEmpty()) {
            for (DialogueVO d : historyChrono) {
                String role = (d.getSender() == DialogueSender.USER) ? "user" : "model";
                String text = d.getContent() == null ? "" : d.getContent();
                if (text.isBlank()) continue;

                contents.add(Content.builder()
                        .role(role)
                        .parts(List.of(Part.fromText(text)))
                        .build());
            }
        }

        // 2) 이번 유저 발화
        contents.add(Content.builder()
                .role("user")
                .parts(List.of(Part.fromText(nullToEmpty(latestUserMessage))))
                .build());

        // 3) 모델 호출
        GenerateContentResponse res = withRetry(
                () -> client.models.generateContent(modelName, contents, null),
                "chatWithMemory:" + modelName
        );
        String text = res.text();
        LlmContext.set(modelName);
        return (text == null || text.isBlank()) ? "빈 응답입니다." : text.trim();
    }

    // 요약 + 장기기억 추출
    @Override
    public SummarizeResult summarizeAndExtract(String existingSummary,
                                               String patch,
                                               String locale) throws Exception {
        Client client = buildClient();

        String sys = """
        너는 채팅의 롤링 요약을 유지하고, 장기 기억 후보를 추출한다.
        
        입력 PATCH는 각 줄이 다음 형식이다:
        - 사용자가 말한 줄: "U#<id>: <내용>"
        - 어시스턴트(캐릭터)가 말한 줄: "A#<id>: <내용>"
        
        반드시 **U# 줄만** 근거로 삼아 memories를 추출하라. A# 줄 내용은 절대 사용하지 말 것.
        
        1) EXISTING 요약과 PATCH를 병합해 간결한 최신 요약(updatedSummary)을 생성:
           - 중복/모순 제거, 최신 우선, 한국어로 %s, 600~800자 권장.
        
        2) U# 줄에서만 장기적 가치가 높은 항목을 memories[]에 JSON으로 추출:
           - category: FAVORITE(좋아하는것) | DISLIKE(싫어하는것) | SCHEDULE(일정)
           - subject: 1~6단어 핵심 키 (예: "사탕", "토끼", "11월1일 부산 여행")
           - value:
               · FAVORITE/DISLIKE: 5~120자, **사용자의 1인칭 선호/비선호**만
               · SCHEDULE: 5~200자, 무엇/언제/어디 (가능하면 ISO 날짜)
           - confidence(0~1) < 0.65 는 제외
           - strengthSuggest(1~5) 제안
           - dueAt: "YYYY-MM-DD" 또는 "YYYY-MM-DDTHH:mm" (SCHEDULE일 때만)
           - meta: {"sourceMid": <정수 U#id>} 를 **반드시 포함**하라.
           - 한 회차 최대 2개.
        
        3) 아래 JSON **그대로만** 출력:
        {
          "updatedSummary": "string",
          "memories": [
            {
              "category": "FAVORITE|DISLIKE|SCHEDULE",
              "subject": "string",
              "value": "string",
              "confidence": 0.0,
              "strengthSuggest": 1,
              "dueAt": "YYYY-MM-DD(THH:mm optional)",
              "meta": { "sourceMid": 0 }
            }
          ]
        }
        """.formatted("ko".equalsIgnoreCase(locale) ? "한국어로 작성" : "respond in " + locale);

        String user = """
                <EXISTING>
                %s
                </EXISTING>
                <PATCH>
                %s
                </PATCH>
                JSON only. No extra text.
                """.formatted(nullToEmpty(existingSummary), nullToEmpty(patch));

        List<Content> contents = new ArrayList<>();
        contents.add(Content.builder()
                .role("user")
                .parts(List.of(Part.fromText("[SYSTEM INSTRUCTION]\n" + sys)))
                .build());
        contents.add(Content.builder()
                .role("user")
                .parts(List.of(Part.fromText(user)))
                .build());

        GenerateContentResponse res = withRetry(
                () -> client.models.generateContent(modelName, contents, null),
                "summarizeAndExtract:" + modelName
        );
        String raw = res.text();
        if (raw == null || raw.isBlank()) {
            log.warn("[LLM] empty summarizeAndExtract response");
            return fallback(existingSummary);
        }

        // 혹시 텍스트가 섞여도 첫 번째 JSON 객체만 뽑아 파싱
        String json = extractFirstJson(raw.trim());
        try {
            JsonNode node = om.readTree(json);
            SummarizeResult out = new SummarizeResult();
            out.setUpdatedSummary(node.path("updatedSummary").asText(""));
            if (node.has("memories") && node.get("memories").isArray()) {
                out.setMemories(
                        om.readerForListOf(SummarizeResult.MemoryCandidate.class)
                                .readValue(node.get("memories"))
                );
            } else {
                out.setMemories(List.of());
            }
            if (out.getUpdatedSummary() == null) out.setUpdatedSummary("");

            LlmContext.set(modelName);

            return out;
        } catch (Exception e) {
            log.warn("[LLM] JSON parse failed. raw={}", safeTrim(raw, 500));
            return fallback(existingSummary);
        }
    }

    private <T> T withRetry(SupplierWithEx<T> work, String op) throws Exception {
        final int maxAttempts = 5;
        int attempt = 0;
        Exception last = null;

        while (attempt < maxAttempts) {
            attempt++;
            try {
                return work.get();
            } catch (ApiException e) {
                int code = tryGetStatusCode(e);
                // 429/500/503 은 재시도
                if (code == 429 || code == 500 || code == 503) {
                    long backoffMs = (long) (Math.pow(2, attempt - 1) * 250); // 250ms, 500, 1s, 2s, 4s
                    backoffMs += ThreadLocalRandom.current().nextLong(75, 225); // 지터
                    log.warn("[LLM] {} attempt {}/{} failed ({}), retrying in {}ms",
                            op, attempt, maxAttempts, code, backoffMs);
                    Thread.sleep(Math.min(backoffMs, 4000));
                    last = e;
                    continue;
                }
                // 그 외 에러는 바로 throw
                throw e;
            } catch (Exception e) {
                last = e;
                break; // 네트워크/직렬화 등은 재시도 비권장: 바로 탈출
            }
        }

        if (last instanceof ApiException ae) {
            int code = tryGetStatusCode(ae);
            if (code == 429) {
                throw new QuotaExceededException("Gemini quota exceeded", ae);
            }
            throw new LlmException("Gemini API error", code, ae);
        }

        throw (last != null) ? last : new RuntimeException("LLM call failed: " + op);
    }

    // 함수형 인터페이스
    @FunctionalInterface
    private interface SupplierWithEx<T> { T get() throws Exception; }

    // ===== helpers =====
    private static String nullToEmpty(String s) { return (s == null) ? "" : s; }

    private static boolean notBlank(String s) { return s != null && !s.isBlank(); }

    private static String nz(String s) { return s == null ? "" : s; }

    private static String trimTo(String s, int max) {
        if (s == null) return "";
        return (s.length() > max) ? s.substring(0, max) + "…" : s;
    }

    private static <T> List<T> limit(List<T> list, int n) {
        if (list == null) return List.of();
        return list.size() > n ? list.subList(0, n) : list;
    }

    private static String extractFirstJson(String s) {
        // ```json ... ``` 제거
        String cleaned = s.replaceAll("```json", "```").trim();
        // 가장 바깥 {} 블록 추출
        Pattern p = Pattern.compile("\\{[\\s\\S]*\\}");
        Matcher m = p.matcher(cleaned);
        if (m.find()) return cleaned.substring(m.start(), m.end());
        return s; // 못 찾으면 원문 시도
    }

    private static String safeTrim(String s, int max) {
        if (s == null) return "";
        return (s.length() > max) ? s.substring(0, max) + "…" : s;
    }

    private SummarizeResult fallback(String existingSummary) {
        SummarizeResult fb = new SummarizeResult();
        fb.setUpdatedSummary(existingSummary == null ? "" : existingSummary);
        fb.setMemories(java.util.List.of()); // 실패 시 메모리는 비움
        return fb;
    }

    private int tryGetStatusCode(ApiException e) {
        // a) 메서드 이름이 버전에 따라 다를 수 있어 리플렉션 시도
        try {
            var m = e.getClass().getMethod("getStatusCode");
            Object v = m.invoke(e);
            if (v instanceof Integer) return (Integer) v;
            if (v != null) return Integer.parseInt(v.toString());
        } catch (Exception ignore) {}

        try {
            var m = e.getClass().getMethod("getCode");
            Object v = m.invoke(e);
            if (v instanceof Integer) return (Integer) v;
            if (v != null) return Integer.parseInt(v.toString());
        } catch (Exception ignore) {}

        try {
            var m = e.getClass().getMethod("getStatus");
            Object v = m.invoke(e);
            if (v instanceof Integer) return (Integer) v;
            if (v != null) return Integer.parseInt(v.toString());
        } catch (Exception ignore) {}

        // b) 메시지에서 4xx/5xx 숫자 추출 (예: "503 . The model is overloaded...")
        String msg = String.valueOf(e);
        java.util.regex.Matcher m = java.util.regex.Pattern
                .compile("\\b(4\\d\\d|5\\d\\d)\\b")
                .matcher(msg);
        if (m.find()) {
            try { return Integer.parseInt(m.group(1)); } catch (Exception ignore) {}
        }

        // c) 못 구하면 재시도 판단을 위해 -1 반환
        return -1;
    }

    // ===========================
    // 장기기억 주입용 레코드 (서비스단 DTO 매핑해 전달)
    // ===========================
    @lombok.Builder
    public static record MemoryItem(
            String category,   // FAVORITE | DISLIKE | SCHEDULE
            String subject,    // 1~6 단어
            String value,      // 5~200자
            String dueAt       // YYYY-MM-DD(THH:mm) | null
    ) {}
}
