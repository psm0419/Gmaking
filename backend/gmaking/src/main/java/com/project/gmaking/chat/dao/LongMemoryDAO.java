package com.project.gmaking.chat.dao;

import com.project.gmaking.chat.vo.LongMemoryVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface LongMemoryDAO {

    // 슬롯 키로 단건 조회
    LongMemoryVO selectBySlot(@Param("userId") String userId,
                              @Param("characterId") int characterId,
                              @Param("category") String category,
                              @Param("subjectNorm") String subjectNorm);

    // 목록(최근 사용순)
    List<LongMemoryVO> selectListByUserAndCharacter(@Param("userId") String userId,
                                                    @Param("characterId") int characterId,
                                                    @Param("limit") int limit);

    // 최근 사용만 터치
    int touchLastUsed(@Param("memoryId") int memoryId);

    // 업서트(INSERT ... ON DUPLICATE KEY UPDATE)
    int upsertSlot(LongMemoryVO vo);

    // (옵션) 용량 제어
    int countByUserAndCharacter(@Param("userId") String userId,
                                @Param("characterId") int characterId);

    int deleteWeakestOldest(@Param("userId") String userId,
                            @Param("characterId") int characterId,
                            @Param("limit") int limit);
}
