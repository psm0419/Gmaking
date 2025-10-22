package com.project.gmaking.chat.llm;

public class QuotaExceededException extends LlmException {
    public QuotaExceededException(String message, Throwable cause) {
        super(message, 429, cause);
    }
}
