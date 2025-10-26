package com.project.gmaking.rag;

import java.util.List;

public class GuideDtos {
    public static class AskRequest {
        private String question;
        public String getQuestion() { return question; }
        public void setQuestion(String question) { this.question = question; }
    }

    public static class AskResponse {
        private String answer;
        private List<Source> sources;

        public AskResponse() {}
        public AskResponse(String answer) { this.answer = answer; }
        public AskResponse(String answer, List<Source> sources) {
            this.answer = answer; this.sources = sources;
        }

        public String getAnswer() { return answer; }
        public void setAnswer(String answer) { this.answer = answer; }

        public List<Source> getSources() { return sources; }
        public void setSources(List<Source> sources) { this.sources = sources; }
    }

    /** 검색된 청크 메타 (프론트에서 자동 가이드 버튼 표시 용) */
    public static class Source {
        private String docPath;
        private Integer chunkIndex;
        private Double score;
        private String preview;

        // front-matter에서 추출 (있으면 세팅)
        private String guideKey; // ex) characterCreate
        private String docUrl;   // ex) /guide/character/create
        private String appUrl;   // ex) http://localhost:3000/create-character

        public Source() {}
        public Source(String docPath, Integer chunkIndex, Double score, String preview,
                      String guideKey, String docUrl, String appUrl) {
            this.docPath = docPath;
            this.chunkIndex = chunkIndex;
            this.score = score;
            this.preview = preview;
            this.guideKey = guideKey;
            this.docUrl = docUrl;
            this.appUrl = appUrl;
        }

        public String getDocPath() { return docPath; }
        public void setDocPath(String docPath) { this.docPath = docPath; }

        public Integer getChunkIndex() { return chunkIndex; }
        public void setChunkIndex(Integer chunkIndex) { this.chunkIndex = chunkIndex; }

        public Double getScore() { return score; }
        public void setScore(Double score) { this.score = score; }

        public String getPreview() { return preview; }
        public void setPreview(String preview) { this.preview = preview; }

        public String getGuideKey() { return guideKey; }
        public void setGuideKey(String guideKey) { this.guideKey = guideKey; }

        public String getDocUrl() { return docUrl; }
        public void setDocUrl(String docUrl) { this.docUrl = docUrl; }

        public String getAppUrl() { return appUrl; }
        public void setAppUrl(String appUrl) { this.appUrl = appUrl; }
    }
}
