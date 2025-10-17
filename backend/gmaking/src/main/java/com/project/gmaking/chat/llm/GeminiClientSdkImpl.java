package com.project.gmaking.chat.llm;


import com.google.genai.Client;
import com.google.genai.types.*;
import com.google.genai.types.HttpOptions;

import com.project.gmaking.chat.constant.DialogueSender;
import com.project.gmaking.chat.vo.DialogueVO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
@Slf4j
@Component
public class GeminiClientSdkImpl implements LlmClient{

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.model.name:gemini-2.0-flash}")
    private String modelName;

    /**.env의 GOOGLE_API_KEY 사용 (System.getenv로 직접 읽음) */
    private Client buildClient() {
        if (apiKey == null || apiKey.isBlank()) {
            // 여기까지 오면 .env 로드/WD 문제이므로 명확히 터뜨려 원인 노출
            throw new IllegalStateException(
                    "Gemini API key is missing. Check 'google.api.key' or env 'GEMINI_API_KEY'."
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
                String role = (d.getSender() == DialogueSender.user) ? "user" : "model";
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
        GenerateContentResponse res = client.models.generateContent(modelName, contents, null);
        String text = res.text();
        return (text == null || text.isBlank()) ? "빈 응답입니다." : text.trim();
    }




}
