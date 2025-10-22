package com.project.gmaking.chat.llm;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class SummarizeResult {
    private String updatedSummary;
    private List<MemoryCandidate> memories;

    @Data
    public static class MemoryCandidate {
        // 기존
        private String type;              // 호환용
        private String subject;
        private String value;
        private Double confidence;
        private Integer strengthSuggest;
        private Boolean isUpdate;
        private Boolean pii;
        private String reason;

        // 추가
        private String category;          // FAVORITE|DISLIKE|SCHEDULE
        private String dueAt;             // ISO 날짜/일시 (옵션)
        private Map<String,Object> meta;
        public Integer getSourceMid() {
            if (meta == null) return null;
            Object v = meta.get("sourceMid");
            if (v instanceof Number) return ((Number) v).intValue();
            try { return v == null ? null : Integer.parseInt(v.toString()); } catch (Exception e) { return null; }
        }
    }
}
