// src/main/java/com/project/gmaking/chat/llm/ChatGptClientSdkImpl.java
package com.project.gmaking.chat.llm;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.gmaking.chat.constant.DialogueSender;
import com.project.gmaking.chat.vo.DialogueVO;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component("chatGptClient")
public class ChatGptClientSdkImpl implements LlmClient {

    @Value("${openai.api.key:}")
    private String apiKey;

    // 비용/속도 밸런스: gpt-4o-mini 권장. 필요시 gpt-4o / o4-mini 등으로 교체
    @Value("${openai.model:gpt-4o-mini}")
    private String model;

    @Value("${openai.timeout.ms:15000}")
    private int timeoutMs;

    private final ObjectMapper om = new ObjectMapper();

    private OkHttpClient http() {
        return new OkHttpClient.Builder()
                .callTimeout(Duration.ofMillis(timeoutMs))
                .build();
    }

    private record Msg(String role, String content) {}

    // --- 공통 호출부 ---------------------------------------------------------

    private String callOpenAi(List<Msg> msgs) throws Exception {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("OpenAI API key is missing. Set 'openai.api.key' or env 'OPENAI_API_KEY'.");
        }

        // 메시지 JSON 구성
        var arr = om.createArrayNode();
        for (Msg m : msgs) {
            arr.add(om.createObjectNode()
                    .put("role", m.role())
                    .put("content", m.content() == null ? "" : m.content()));
        }
        var root = om.createObjectNode()
                .put("model", model)
                .set("messages", arr);

        Request req = new Request.Builder()
                .url("https://api.openai.com/v1/chat/completions")
                .addHeader("Authorization", "Bearer " + apiKey)
                .addHeader("Content-Type", "application/json")
                .post(RequestBody.create(root.toString(), MediaType.parse("application/json")))
                .build();

        // 429/500/503 지수 백오프 재시도
        return withRetry(() -> {
            try (Response res = http().newCall(req).execute()) {
                if (!res.isSuccessful()) {
                    int code = res.code();
                    String err = res.body() != null ? res.body().string() : "";
                    if (code == 429) throw new QuotaExceededException("OpenAI quota/rate limit exceeded: " + err, null);
                    throw new LlmException("OpenAI error: " + err, code, null);
                }
                String json = res.body() != null ? res.body().string() : "";
                JsonNode r = om.readTree(json);
                return r.path("choices").get(0).path("message").path("content").asText("");
            }
        }, "openai:chat");
    }

    @FunctionalInterface
    private interface SupplierX<T> { T get() throws Exception; }

    private <T> T withRetry(SupplierX<T> work, String op) throws Exception {
        final int maxAttempts = 5;
        int attempt = 0;
        Exception last = null;
        while (attempt < maxAttempts) {
            attempt++;
            try {
                return work.get();
            } catch (QuotaExceededException qe) {
                // 쿼터 초과는 즉시 포기 → Fallback이 잡아서 전환
                throw qe;
            } catch (LlmException le) {
                // 500/503만 재시도, 그 외는 바로 위임
                int s = le.getStatus();
                if (s == 500 || s == 503) {
                    long backoffMs = (long) (Math.pow(2, attempt - 1) * 250)
                            + ThreadLocalRandom.current().nextLong(75, 225);
                    log.warn("[LLM] {} attempt {}/{} failed ({}), retrying {}ms", op, attempt, maxAttempts, s, backoffMs);
                    Thread.sleep(Math.min(backoffMs, 4000));
                    last = le;
                    continue;
                }
                throw le;
            } catch (Exception e) {
                // 네트워크/예상치 못한 예외는 1회만 재시도하고 포기(취향껏 변경)
                if (attempt >= 2) throw e;
                long backoffMs = 300;
                log.warn("[LLM] {} transient error, retry {}ms", op, backoffMs);
                Thread.sleep(backoffMs);
                last = e;
            }
        }
        throw (last != null) ? last : new RuntimeException("OpenAI call failed: " + op);
    }

    private static String nullToEmpty(String s) { return s == null ? "" : s; }
    private static String safeTrim(String s, int max) {
        if (s == null) return "";
        return s.length() > max ? s.substring(0, max) + "…" : s;
    }
    private static String extractFirstJson(String s) {
        String cleaned = s.replaceAll("```json", "```").trim();
        Pattern p = Pattern.compile("\\{[\\s\\S]*\\}");
        Matcher m = p.matcher(cleaned);
        if (m.find()) return cleaned.substring(m.start(), m.end());
        return s;
    }

    // --- LlmClient 구현 ------------------------------------------------------

    @Override
    public String chat(String systemPrompt, String userMessage) throws Exception {
        List<Msg> msgs = new ArrayList<>();
        if (systemPrompt != null && !systemPrompt.isBlank()) {
            msgs.add(new Msg("system", systemPrompt));
        }
        msgs.add(new Msg("user", userMessage));
        String text = callOpenAi(msgs);

        LlmContext.set(model);

        return (text == null || text.isBlank()) ? "빈 응답입니다." : text.trim();
    }

    @Override
    public String chatWithHistory(String systemPrompt, List<DialogueVO> historyChrono, String latestUserMessage) throws Exception {
        List<Msg> msgs = new ArrayList<>();
        if (systemPrompt != null && !systemPrompt.isBlank()) {
            msgs.add(new Msg("system", systemPrompt));
        }
        if (historyChrono != null) {
            for (DialogueVO d : historyChrono) {
                String content = nullToEmpty(d.getContent());
                if (content.isBlank()) continue;
                boolean isAssistant = d.getSender() != null && d.getSender() != DialogueSender.USER;
                msgs.add(new Msg(isAssistant ? "assistant" : "user", content));
            }
        }
        msgs.add(new Msg("user", latestUserMessage));
        String text = callOpenAi(msgs);

        LlmContext.set(model);

        return (text == null || text.isBlank()) ? "빈 응답입니다." : text.trim();
    }

    @Override
    public SummarizeResult summarizeAndExtract(String existingSummary, String patch, String locale) throws Exception {
        // 같은 포맷을 그대로 재사용 — Gemini와 동일한 출력 JSON 스키마 기대
        String sys = """
                You are a summarizer & memory extractor. Keep language=%s.
                Merge 'existing summary' with 'recent patch'.
                Output strictly:
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
                """.formatted("ko".equalsIgnoreCase(locale) ? "Korean" : locale);

        String user = """
                [EXISTING]
                %s

                [PATCH]
                %s

                JSON only. No extra text.
                """.formatted(nullToEmpty(existingSummary), nullToEmpty(patch));

        String raw = chat(sys, user);
        if (raw == null || raw.isBlank()) {
            log.warn("[LLM] empty summarizeAndExtract(OpenAI) response");
            SummarizeResult fb = new SummarizeResult();
            fb.setUpdatedSummary(existingSummary == null ? "" : existingSummary);
            fb.setMemories(List.of());
            return fb;
        }

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

            LlmContext.set(model);

            return out;
        } catch (Exception e) {
            log.warn("[LLM] JSON parse failed(OpenAI). raw={}", safeTrim(raw, 500));
            SummarizeResult fb = new SummarizeResult();
            fb.setUpdatedSummary(existingSummary == null ? "" : existingSummary);
            fb.setMemories(List.of());
            return fb;
        }
    }
}
