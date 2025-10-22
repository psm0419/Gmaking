package com.project.gmaking.chat.llm;

public final class LlmContext {
    private static final ThreadLocal<String> LAST_MODEL = new ThreadLocal<>();

    private LlmContext() {}

    public static void set(String model) { LAST_MODEL.set(model); }
    public static String get() { return LAST_MODEL.get(); }
    public static void clear() { LAST_MODEL.remove(); }
}