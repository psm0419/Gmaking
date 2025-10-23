package com.project.gmaking.growth.dao;

import com.project.gmaking.growth.vo.GrowthImageVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface GrowthDAO {
    int insertNewImageRecord(GrowthImageVO growthImageVO);

    int updateCharacterEvolution(
            @Param("characterId") Long characterId,
            @Param("userId") String userId,
            @Param("newStep") Integer newStep,
            @Param("newImageId") Long newImageId
    );
}
