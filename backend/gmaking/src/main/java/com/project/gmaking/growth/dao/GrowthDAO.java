package com.project.gmaking.growth.dao;

import com.project.gmaking.growth.vo.GrowthImageVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface GrowthDAO {
    // 캐릭터 ID를 사용하여 tb_character 테이블에서 현재 진화 단계를 조회합니다.
    Integer findCharacterEvolutionStep(@Param("characterId") Long characterId);

    // 💡 누락된 메서드 추가: tb_character에서 user_id를 조회합니다.
    String findUserIdByCharacterId(@Param("characterId") Long characterId);

    int updateImageRecord(
            @Param("imageId") Long imageId,
            @Param("image") GrowthImageVO growthImageVO,
            @Param("userId") String userId
    );

    // tb_character에서 현재 IMAGE_ID를 조회하는 메서드 추가
    Long findCurrentImageId(@Param("characterId") Long characterId);

    int updateCharacterEvolution(
            @Param("characterId") Long characterId,
            @Param("userId") String userId,
            @Param("newStep") Integer newStep,
            @Param("newImageId") Long newImageId
    );
}