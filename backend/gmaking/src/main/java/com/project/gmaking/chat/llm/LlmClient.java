package com.project.gmaking.chat.llm;

public interface LlmClient {
    String chat(String systemPrompt, String userMessage) throws Exception;
}
