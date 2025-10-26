// src/main/java/com/project/gmaking/rag/MysqlRetriever.java
package com.project.gmaking.rag;

import dev.langchain4j.model.embedding.EmbeddingModel;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Component
public class MysqlRetriever {

    private final RagEmbeddingDao ragDao;
    private final EmbeddingModel embeddingModel;

    public record RetrievedChunk(
            String text,
            String docPath,
            Integer chunkIndex,
            double score,
            String guideKey,
            String docUrl,
            String appUrl
    ) {}

    public MysqlRetriever(RagEmbeddingDao ragDao, EmbeddingModel embeddingModel) {
        this.ragDao = ragDao;
        this.embeddingModel = embeddingModel;
    }

    public List<RetrievedChunk> topK(String query, int k) {
        var qv = embeddingModel.embed(query).content().vector();

        // 1) 전부 로드 + 점수 계산 + front-matter 1차 파싱
        var allRows = ragDao.selectAll();
        var parsed = allRows.stream().map(r -> {
            float[] v = VectorIO.toFloatArray(r.getVector());
            double score = VectorIO.cosine(qv, v);
            var meta = parseFrontMatter(r.getText());
            return new Tmp(
                    r.getText(), r.getDocPath(), r.getChunkIndex(), score,
                    meta.guideKey, meta.docUrl, meta.appUrl
            );
        }).collect(Collectors.toList());

        // 2) 문서 단위로 front-matter 가진 청크를 인덱싱 (문서의 대표 메타)
        Map<String, Meta> docMeta = new HashMap<>();
        for (var t : parsed) {
            if (isNotBlank(t.guideKey) || isNotBlank(t.docUrl) || isNotBlank(t.appUrl)) {
                docMeta.putIfAbsent(t.docPath, new Meta(t.guideKey, t.docUrl, t.appUrl));
            }
        }

        // 3) 점수 순 정렬 → 상위 K 추출
        var top = parsed.stream()
                .sorted(Comparator.comparingDouble((Tmp x) -> x.score).reversed())
                .limit(k)
                .map(t -> {
                    // 4) 상위 K 중 메타 비어있으면 동일 문서의 대표 메타로 보강
                    Meta m = docMeta.getOrDefault(t.docPath, inferFromPath(t.docPath));
                    String gk = firstNonBlank(t.guideKey, m.guideKey);
                    String du = firstNonBlank(t.docUrl,   m.docUrl);
                    String au = firstNonBlank(t.appUrl,   m.appUrl);
                    return new RetrievedChunk(t.text, t.docPath, t.chunkIndex, t.score, gk, du, au);
                })
                .toList();

        return top;
    }

    // ---------- helpers ----------

    private static class Tmp {
        String text, docPath;
        Integer chunkIndex;
        double score;
        String guideKey, docUrl, appUrl;
        Tmp(String text, String docPath, Integer chunkIndex, double score,
            String guideKey, String docUrl, String appUrl) {
            this.text = text; this.docPath = docPath; this.chunkIndex = chunkIndex; this.score = score;
            this.guideKey = guideKey; this.docUrl = docUrl; this.appUrl = appUrl;
        }
    }

    private static class Meta {
        String guideKey, docUrl, appUrl;
        Meta(String g, String d, String a) { this.guideKey = g; this.docUrl = d; this.appUrl = a; }
    }

    // front-matter 정규식
    private static final Pattern RE_GUIDE_KEY = Pattern.compile("(?im)^\\s*guide_key\\s*:\\s*([A-Za-z0-9_-]+)\\s*$");
    private static final Pattern RE_DOC_URL   = Pattern.compile("(?im)^\\s*doc_url\\s*:\\s*(\\S+)\\s*$");
    private static final Pattern RE_APP_URL   = Pattern.compile("(?im)^\\s*app_url\\s*:\\s*(\\S+)\\s*$");

    private static Meta parseFrontMatter(String text) {
        if (text == null) return new Meta(null, null, null);
        String gk = findOne(RE_GUIDE_KEY, text);
        String du = findOne(RE_DOC_URL, text);
        String au = findOne(RE_APP_URL, text);
        return new Meta(gk, du, au);
    }

    // 문서 경로로 대략 추론(메타가 전혀 없을 때 대비)
    private static Meta inferFromPath(String path) {
        if (path == null) return new Meta(null, null, null);
        String p = path.toLowerCase(Locale.ROOT);
        if (p.contains("character") && p.contains("create")) {
            return new Meta("characterCreate", "/guide/character/create", "http://localhost:3000/create-character");
        }
        if (p.endsWith("chat.md") || p.contains("/chat")) {
            return new Meta("chat", "/guide/chat", "http://localhost:3000/chat-entry");
        }
        return new Meta(null, null, null);
    }

    private static String findOne(Pattern re, String s) {
        Matcher m = re.matcher(s);
        return m.find() ? m.group(1) : null;
    }

    private static boolean isNotBlank(String s) {
        return s != null && !s.isBlank();
    }

    private static String firstNonBlank(String a, String b) {
        return isNotBlank(a) ? a : (isNotBlank(b) ? b : null);
    }

    public static String preview(String s) {
        if (s == null) return "";
        s = s.trim().replaceAll("\\s+", " ");
        return s.length() > 140 ? s.substring(0, 140) + "…" : s;
    }
}
