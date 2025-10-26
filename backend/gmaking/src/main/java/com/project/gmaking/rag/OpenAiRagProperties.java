package com.project.gmaking.rag;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "openai.rag")
public class OpenAiRagProperties {
    /** OpenAI API Key (OPENAI_RAG_API_KEY or OPENAI_API_KEY 에서 바인딩됨) */
    private String apiKey;

    /** Chat 모델명 (기본값: gpt-4o-mini) */
    private String chatModel = "gpt-4o-mini";

    /** 임베딩 모델명 (기본값: text-embedding-3-small) */
    private String embeddingModel = "text-embedding-3-small";

    /** temperature (기본값: 0.2) */
    private Double temperature = 0.2;

    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }

    public String getChatModel() { return chatModel; }
    public void setChatModel(String chatModel) { this.chatModel = chatModel; }

    public String getEmbeddingModel() { return embeddingModel; }
    public void setEmbeddingModel(String embeddingModel) { this.embeddingModel = embeddingModel; }

    public Double getTemperature() { return temperature; }
    public void setTemperature(Double temperature) { this.temperature = temperature; }
}
