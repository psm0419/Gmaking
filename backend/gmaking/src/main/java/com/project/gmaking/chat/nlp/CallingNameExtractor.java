package com.project.gmaking.chat.nlp;

import com.project.gmaking.chat.llm.LlmClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
@Component
@RequiredArgsConstructor
public class CallingNameExtractor {
    private final LlmClient llm;

    public String extract(String userUtterance, String currentCalling) {
        String sys = """
            사용자가 자신을 뭐라고 불러달라고 했는지 추출하라.
            예) "저 쿠로라고 불러", "앞으로 나 '민지'라고 불러줘"
            규칙:
            - 새 호칭만 순수 텍스트로 반환 (따옴표, 이모지, 접미사 제거)
            - 못 찾으면 빈 문자열
        """;
        try {
            String res = llm.chat(sys, userUtterance);
            if (res == null) return "";
            String v = res.trim();
            if (v.length() > 20) v = v.substring(0, 20); // 과도 방어

            if (v.equalsIgnoreCase("없음") ||
                    v.equalsIgnoreCase("none") ||
                    v.equalsIgnoreCase("빈 응답입니다.") ||
                    v.equalsIgnoreCase("no response") ||
                    v.isBlank()) {
                return "";
            }

            if (v.equalsIgnoreCase("없음") || v.equalsIgnoreCase("none")) return "";
            // 기존과 동일하면 변경 안 함
            if (currentCalling != null && currentCalling.equals(v)) return "";
            // 안전 필터(공백/따옴표 제거)
            v = v.replaceAll("[\"'`]", "").trim();
            return v;
        } catch (Exception e) {
            return "";
        }
    }
}

