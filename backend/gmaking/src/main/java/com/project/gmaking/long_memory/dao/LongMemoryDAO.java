package com.project.gmaking.long_memory.dao;

import com.project.gmaking.long_memory.vo.LongMemoryVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;

@Mapper
public interface LongMemoryDAO {
    int upsert(LongMemoryVO m);  // (conversation_id, memory_date) unique
    LongMemoryVO find(@Param("conversationId") int convId,
                      @Param("date") LocalDate date);
}
