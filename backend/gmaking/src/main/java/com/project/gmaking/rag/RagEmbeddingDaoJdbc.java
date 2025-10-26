package com.project.gmaking.rag;

import org.springframework.jdbc.core.BatchPreparedStatementSetter;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

@Repository
public class RagEmbeddingDaoJdbc implements RagEmbeddingDao {

    private final JdbcTemplate jdbc;

    public RagEmbeddingDaoJdbc(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private static final RowMapper<RagChunkVO> ROW_MAPPER = new RowMapper<>() {
        @Override
        public RagChunkVO mapRow(ResultSet rs, int rowNum) throws SQLException {
            RagChunkVO e = new RagChunkVO();
            e.setId(rs.getLong("id"));
            e.setDocPath(rs.getString("doc_path"));
            e.setChunkIndex(rs.getInt("chunk_index"));
            e.setText(rs.getString("text"));
            e.setVector(rs.getBytes("vector"));
            return e;
        }
    };

    @Override
    public int deleteByDocPath(String docPath) {
        String sql = "DELETE FROM tb_rag_embedding_chunk WHERE doc_path = ?";
        return jdbc.update(sql, docPath);
    }

    @Override
    public int[] batchUpsert(List<RagChunkVO> chunks) {
        String sql = """
            INSERT INTO tb_rag_embedding_chunk (doc_path, chunk_index, text, vector)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE text = VALUES(text), vector = VALUES(vector)
            """;

        return jdbc.batchUpdate(sql, new BatchPreparedStatementSetter() {
            @Override
            public void setValues(PreparedStatement ps, int i) throws SQLException {
                RagChunkVO e = chunks.get(i);
                ps.setString(1, e.getDocPath());
                ps.setInt(2, e.getChunkIndex());
                ps.setString(3, e.getText());
                ps.setBytes(4, e.getVector());
            }
            @Override
            public int getBatchSize() { return chunks.size(); }
        });
    }

    @Override
    public List<RagChunkVO> selectAll() {
        String sql = "SELECT id, doc_path, chunk_index, text, vector FROM tb_rag_embedding_chunk";
        return jdbc.query(sql, ROW_MAPPER);
    }
}
