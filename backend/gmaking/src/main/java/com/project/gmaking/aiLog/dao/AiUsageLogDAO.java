package com.project.gmaking.aiLog.dao;

import com.project.gmaking.aiLog.vo.AiUsageLogVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface AiUsageLogDAO {
    int upsertGeminiUsage(
            @Param("userId") String userId,
            @Param("featureType") String featureType,  // "chat"
            @Param("modelName") String modelName,      // "gemini-2.0-flash"
            @Param("usageStatus") String usageStatus,  // success | quota_exceeded | error
            @Param("errorMessage") String errorMessage,
            @Param("actor") String actor
    );
}
