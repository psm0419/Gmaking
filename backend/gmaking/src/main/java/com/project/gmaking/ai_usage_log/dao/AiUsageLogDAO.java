package com.project.gmaking.ai_usage_log.dao;

import com.project.gmaking.ai_usage_log.vo.AiUsageLogVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface AiUsageLogDAO {
    AiUsageLogVO findByCharacterId(@Param("characterId") int characterId);
}
