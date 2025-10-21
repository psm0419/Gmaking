package com.project.gmaking.chat.llm;

public interface LlmClient {
    String chat(String systemPrompt, String userMessage) throws Exception;

    String chatWithHistory(String systemPrompt,
                           java.util.List<com.project.gmaking.chat.vo.DialogueVO> historyChrono,
                           String latestUserMessage) throws Exception;


    // 이전 요약 + 최근 패치
    SummarizeResult summarizeAndExtract(String existingSummary,
                                        String patch,
                                        String locale) throws Exception;
}
