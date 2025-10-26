package com.project.gmaking.rag;

import dev.langchain4j.data.document.Document;
import dev.langchain4j.data.document.loader.FileSystemDocumentLoader;
import dev.langchain4j.data.document.parser.TextDocumentParser;
import dev.langchain4j.data.document.splitter.DocumentSplitters;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import jakarta.annotation.PostConstruct;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.FileSystems;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.PathMatcher;
import java.util.ArrayList;
import java.util.List;

@Component
public class GuidesIndexer {

    private final RagProperties ragProps;
    private final EmbeddingModel embeddingModel;
    private final RagEmbeddingDao ragDao;

    public GuidesIndexer(RagProperties ragProps,
                         EmbeddingModel embeddingModel,
                         RagEmbeddingDao ragDao) {
        this.ragProps = ragProps;
        this.embeddingModel = embeddingModel;
        this.ragDao = ragDao;
    }

    @PostConstruct
    @Transactional
    public void ingestGuides() {
        try {
            // 🔒 비용 방지: autoIngest=false면 즉시 종료
            if (!ragProps.isAutoIngest()) {
                System.out.println("[RAG] Skip ingest: app.rag.autoIngest=false");
                return;
            }

            String cfg = ragProps.getGuidesDir();
            if (cfg == null || cfg.isBlank()) {
                System.out.println("[RAG] Skip ingest: app.rag.guidesDir is empty");
                return;
            }

            // === 1) base 경로 결정 (classpath: 또는 파일시스템) ===
            Path base;
            if (cfg.startsWith("classpath:")) {
                String cpDir = cfg.substring("classpath:".length());
                ClassPathResource cpr = new ClassPathResource(cpDir);
                if (!cpr.exists()) {
                    System.out.println("[RAG] Skip ingest: classpath dir not found -> " + cpDir);
                    return;
                }
                // NOTE: fat-jar에서는 getFile() 이 불가할 수 있음(개발/로컬은 OK).
                base = cpr.getFile().toPath().toAbsolutePath().normalize();
                System.out.println("[RAG] Using classpath dir -> " + base);
            } else {
                base = Path.of(cfg).toAbsolutePath().normalize();
                System.out.println("[RAG] Using filesystem dir -> " + base);
            }

            System.out.println("[RAG] Guides path -> exists=" + Files.exists(base)
                    + ", isDir=" + Files.isDirectory(base)
                    + ", path=" + base);

            if (!Files.isDirectory(base)) {
                System.out.println("[RAG] Skip ingest: not a directory -> " + base);
                return;
            }

            // 1-depth 자식 목록 디버그
            try (var s = Files.list(base)) {
                s.forEach(p -> System.out.println("[RAG] child: " + p.getFileName()));
            } catch (Exception ignore) {}

            // === 2) 문서 로드 (확장자 필터: md / mdx, 대소문자 모두) ===
            var parser = new TextDocumentParser();
            List<Document> docs = collectDocs(base, parser, List.of("md","MD","mdx","MDX"));
            System.out.println("[RAG] Loader found " + docs.size() + " docs under " + base);
//            docs.addAll(collectDocsByExt(base, parser, "md"));
//            docs.addAll(collectDocsByExt(base, parser, "MD"));
//            docs.addAll(collectDocsByExt(base, parser, "mdx"));
//            docs.addAll(collectDocsByExt(base, parser, "MDX"));

            if (docs.isEmpty()) {
                System.out.println("[RAG] No docs to index. Stop.");
                return;
            }

            // === 3) 청킹 & 임베딩 & 저장 ===
            var splitter = DocumentSplitters.recursive(1000, 200);

            for (Document doc : docs) {
                String docPath = doc.metadata().getString("file_path");
                if (docPath == null) docPath = "unknown";

                // 기존 문서 삭제(간단 동기화)
                ragDao.deleteByDocPath(docPath);

                // 임베딩(여기서부터 비용 발생)
                List<TextSegment> segments = splitter.split(doc);
                var embeddings = embeddingModel.embedAll(segments).content();

                List<RagChunkVO> batch = new ArrayList<>(segments.size());
                for (int i = 0; i < segments.size(); i++) {
                    var seg = segments.get(i);
                    var emb = embeddings.get(i).vector();

                    RagChunkVO e = new RagChunkVO();
                    e.setDocPath(docPath);
                    e.setChunkIndex(i);
                    e.setText(seg.text());
                    e.setVector(VectorIO.toBytes(emb));
                    batch.add(e);
                }

                ragDao.batchUpsert(batch);
                System.out.println("[RAG] Upserted chunks for " + docPath + " -> " + batch.size());
            }

            System.out.println("[RAG] Indexed to MySQL via DAO: " + docs.size() + " docs at " + base);
        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("[RAG] RAG ingest failed: " + e.getMessage());
        }
    }

    private static List<Document> collectDocs(Path base, TextDocumentParser parser, List<String> exts) {
        List<Document> out = new ArrayList<>();
        try {
            Files.walk(base)
                    .filter(Files::isRegularFile)
                    .filter(p -> {
                        String name = p.getFileName().toString();
                        int i = name.lastIndexOf('.');
                        if (i < 0) return false;
                        String ext = name.substring(i + 1);
                        return exts.contains(ext);
                    })
                    .forEach(p -> {
                        try {
                            var d = FileSystemDocumentLoader.loadDocument(p, parser);
                            // 메타데이터에 파일 경로 넣기(아래 deleteByDocPath용)
                            d.metadata().put("file_path", p.toAbsolutePath().normalize().toString());
                            out.add(d);
                            System.out.println("[RAG] + doc: " + p);
                        } catch (Exception e) {
                            System.err.println("[RAG] Failed to load doc: " + p + " -> " + e.getMessage());
                        }
                    });
        } catch (Exception e) {
            System.err.println("[RAG] collectDocs failed: " + e.getMessage());
        }
        return out;
    }

//    private static List<Document> collectDocsByExt(Path base, TextDocumentParser parser, String ext) {
//        PathMatcher matcher = FileSystems.getDefault().getPathMatcher("glob:**/*." + ext);
//        return FileSystemDocumentLoader.loadDocuments(base, matcher, parser);
//    }
}
