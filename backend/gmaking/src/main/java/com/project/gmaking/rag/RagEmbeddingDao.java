package com.project.gmaking.rag;

import java.util.List;

public interface RagEmbeddingDao {
    int deleteByDocPath(String docPath);
    int[] batchUpsert(List<RagChunkVO> chunks);  // VO 타입을 RagChunkVO로
    List<RagChunkVO> selectAll();
}