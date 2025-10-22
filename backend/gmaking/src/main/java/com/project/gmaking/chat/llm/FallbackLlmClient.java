package com.project.gmaking.chat.llm;

import com.project.gmaking.chat.vo.DialogueVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.List;

@Slf4j
@RequiredArgsConstructor
public class FallbackLlmClient implements LlmClient {

    private final LlmClient primary;   // Gemini
    private final LlmClient secondary; // ChatGPT
    private final int retryOnPrimary;  // e.g. 1

    @Override
    public String chat(String systemPrompt, String userMessage) throws Exception {
        int attempt = 0;
        while (true) {
            try {
                attempt++;
                return primary.chat(systemPrompt, userMessage);
            } catch (QuotaExceededException qe) {
                log.warn("[Fallback] Gemini quota exceeded -> switch to ChatGPT");
                break;
            } catch (LlmException le) {
                log.warn("[Fallback] Gemini failed status={}, attempt={}", le.getStatus(), attempt);
                if (attempt > retryOnPrimary) break;
                Thread.sleep(300L * attempt);
            } catch (Exception e) {
                log.warn("[Fallback] Gemini unexpected error attempt={}", attempt, e);
                if (attempt > retryOnPrimary) break;
                Thread.sleep(300L * attempt);
            }
        }
        return secondary.chat(systemPrompt, userMessage);
    }

    @Override
    public String chatWithHistory(String systemPrompt, List<DialogueVO> historyChrono, String latestUserMessage) throws Exception {
        int attempt = 0;
        while (true) {
            try {
                attempt++;
                return primary.chatWithHistory(systemPrompt, historyChrono, latestUserMessage);
            } catch (QuotaExceededException qe) {
                log.warn("[Fallback] Gemini quota exceeded -> switch to ChatGPT");
                break;
            } catch (LlmException le) {
                log.warn("[Fallback] Gemini failed status={}, attempt={}", le.getStatus(), attempt);
                if (attempt > retryOnPrimary) break;
                Thread.sleep(300L * attempt);
            } catch (Exception e) {
                log.warn("[Fallback] Gemini unexpected error attempt={}", attempt, e);
                if (attempt > retryOnPrimary) break;
                Thread.sleep(300L * attempt);
            }
        }
        return secondary.chatWithHistory(systemPrompt, historyChrono, latestUserMessage);
    }

    @Override
    public SummarizeResult summarizeAndExtract(String existingSummary, String patch, String locale) throws Exception {
        int attempt = 0;
        while (true) {
            try {
                attempt++;
                return primary.summarizeAndExtract(existingSummary, patch, locale);
            } catch (QuotaExceededException qe) {
                log.warn("[Fallback] Gemini quota exceeded -> switch to ChatGPT");
                log.info("[LLM] using SECONDARY(OpenAI) for op=chatWithHistory");
                break;
            } catch (LlmException le) {
                log.warn("[Fallback] Gemini failed status={}, attempt={}", le.getStatus(), attempt);
                if (attempt > retryOnPrimary) break;
                Thread.sleep(300L * attempt);
            } catch (Exception e) {
                log.warn("[Fallback] Gemini unexpected error attempt={}", attempt, e);
                if (attempt > retryOnPrimary) break;
                Thread.sleep(300L * attempt);
            }
        }
        return secondary.summarizeAndExtract(existingSummary, patch, locale);
    }
}