package com.project.gmaking.chat.llm;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
public class LlmConfig {

    @Bean("llmClient") // 기존 코드가 주입받는 이름 유지
    @Primary
    public LlmClient llmClient(GeminiClientSdkImpl geminiClient,
                               ChatGptClientSdkImpl chatGptClient) {
        // 1회 재시도 후 실패 시 ChatGPT로 전환
        return new FallbackLlmClient(geminiClient, chatGptClient, 1);
    }
}

