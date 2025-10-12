package com.project.gmaking.chat.llm;


import com.google.genai.Client;
import com.google.genai.types.*;
import com.google.genai.types.HttpOptions;

import org.springframework.stereotype.Component;

@Component
public class GeminiClientSdkImpl implements LlmClient{

    private static final String MODEL_NAME = "gemini-2.0-flash";

    /**.env의 GOOGLE_API_KEY 사용 (System.getenv로 직접 읽음) */
    private Client buildClient() {
        return Client.builder()
                .apiKey(System.getenv("GOOGLE_API_KEY"))
                .httpOptions(
                        HttpOptions.builder()
                                .apiVersion("v1")
                                .build()          // ← 이거 추가!
                )
                .build();
    }

    @Override
    public String chat(String systemPrompt, String userMessage) throws Exception {
        Client client = buildClient();

        // 1) 메시지 리스트
        java.util.List<Content> contents = new java.util.ArrayList<>();

        // (옵션) 시스템 프롬프트를 user 역할의 선행 메시지로 추가
        if (systemPrompt != null && !systemPrompt.isBlank()) {
            contents.add(
                    Content.builder()
                            .role("user")
                            .parts(java.util.List.of(Part.fromText("[SYSTEM INSTRUCTION]\n" + systemPrompt)))
                            .build()
            );
        }

        // 실제 유저 메시지
        contents.add(
                Content.builder()
                        .role("user")
                        .parts(java.util.List.of(Part.fromText(userMessage)))
                        .build()
        );

        // 2) 모델 호출 (config=null)
        GenerateContentResponse res = client.models
                .generateContent(MODEL_NAME, contents, null);

        String text = res.text();
        return (text == null || text.isBlank()) ? "빈 응답입니다." : text.trim();
    }



}
