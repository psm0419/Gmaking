package com.project.gmaking.chat.llm;


import com.google.genai.Client;
import com.google.genai.types.Content;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.Part;
import org.springframework.beans.factory.annotation.Value;

import org.springframework.stereotype.Component;

@Component
public class GeminiClientSdkImpl implements LlmClient{

    @Value("${GEMINI_MODEL_NAME:gemini-1.5-flash}")
    private String modelName;

    private Client buildClient() {
        return new Client();
    }

    @Override
    public String chat(String systemPrompt, String userMessage) throws Exception {
        Client client = buildClient();

        // 사용자 입력을 Gemini SDK Content 형식으로 변환
        Content user = Content.fromParts(Part.fromText(userMessage));

        // 시스템 프롬프트가 있으면 config에 포함
        GenerateContentConfig config = null;
        if (systemPrompt != null && !systemPrompt.isBlank()) {
            Content systemInstruction = Content.fromParts(Part.fromText(systemPrompt));
            config = GenerateContentConfig.builder()
                    .systemInstruction(systemInstruction)
                    .build();
        }

        // 모델 호출 (SDK 내부에서 자동 인증)
        GenerateContentResponse res = client.models
                .generateContent(modelName, user, config);

        // 응답 텍스트 반환
        String text = res.text();
        return (text == null || text.isBlank()) ? "빈 응답입니다." : text.trim();
    }

}
