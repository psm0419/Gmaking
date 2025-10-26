package com.project.gmaking.rag;

import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.model.openai.OpenAiEmbeddingModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

@Configuration
public class RagConfig {

    @Bean
    public ChatLanguageModel ragChatModel(OpenAiRagProperties props) {
        if (!StringUtils.hasText(props.getApiKey())) {
            throw new IllegalStateException(
                    "openai.rag.api.key 가 비어 있습니다. 환경변수 OPENAI_RAG_API_KEY 또는 application.properties에 값을 넣어주세요."
            );
        }
        return OpenAiChatModel.builder()
                .apiKey(props.getApiKey())
                .modelName(props.getChatModel())
                .temperature(props.getTemperature() == null ? 0.2 : props.getTemperature())
                .build();
    }

    @Bean
    public EmbeddingModel ragEmbeddingModel(OpenAiRagProperties props) {
        if (!StringUtils.hasText(props.getApiKey())) {
            throw new IllegalStateException("openai.rag.api.key 가 비어 있습니다.");
        }
        return OpenAiEmbeddingModel.builder()
                .apiKey(props.getApiKey())
                .modelName(props.getEmbeddingModel())
                .build();
    }
}
