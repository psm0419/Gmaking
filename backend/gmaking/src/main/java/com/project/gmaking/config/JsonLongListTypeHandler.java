package com.project.gmaking.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.ibatis.type.BaseTypeHandler;
import org.apache.ibatis.type.JdbcType;
import org.springframework.stereotype.Component;
import java.sql.CallableStatement;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

/**
 * List<Long> (Java) 객체와 MySQL JSON 타입 컬럼을 매핑하는 커스텀 TypeHandler.
 * 게시글의 image_ids 필드 처리에 사용됩니다.
 */
public class JsonLongListTypeHandler extends BaseTypeHandler<List<Long>> {

    private final ObjectMapper objectMapper;

    // ObjectMapper는 Spring Bean으로 자동 주입됩니다.
    public JsonLongListTypeHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    // 1. 자바 객체를 JDBC로 전달할 때 (INSERT/UPDATE 시 List<Long> -> JSON 문자열)
    @Override
    public void setNonNullParameter(PreparedStatement ps, int i, List<Long> parameter, JdbcType jdbcType) throws SQLException {
        try {
            // List<Long>을 JSON 문자열로 변환
            String jsonString = objectMapper.writeValueAsString(parameter);
            ps.setString(i, jsonString);
        } catch (Exception e) {
            throw new SQLException("Failed to convert List<Long> to JSON string for DB", e);
        }
    }

    // 2. DB에서 값을 가져올 때 (JSON 문자열 -> List<Long>)
    @Override
    public List<Long> getNullableResult(ResultSet rs, String columnName) throws SQLException {
        String jsonString = rs.getString(columnName);
        return parseJsonString(jsonString);
    }

    @Override
    public List<Long> getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        String jsonString = rs.getString(columnIndex);
        return parseJsonString(jsonString);
    }

    @Override
    public List<Long> getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        String jsonString = cs.getString(columnIndex);
        return parseJsonString(jsonString);
    }

    // JSON 문자열 파싱 유틸리티
    private List<Long> parseJsonString(String jsonString) throws SQLException {
        if (jsonString == null || jsonString.isEmpty()) {
            return null;
        }
        try {
            // JSON 문자열을 List<Long> 타입으로 역직렬화
            return objectMapper.readValue(jsonString, new TypeReference<List<Long>>() {});
        } catch (Exception e) {
            // 파싱 오류 발생 시 SQL 예외 발생
            throw new SQLException("Failed to convert JSON string to List<Long>", e);
        }
    }
}
