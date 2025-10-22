package com.project.gmaking.chat.llm;

public class LlmException extends RuntimeException {
    private final int status;

    public LlmException(String message, int status, Throwable cause) {
        super(message, cause);
        this.status = status;
    }

    public int getStatus() { return status; }
}
