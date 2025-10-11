package com.project.gmaking.map.dao;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import com.project.gmaking.map.vo.MapVO;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface MapDAO {
    List<MapVO> selectAllMaps();
    // 맵 ID로 특정 맵 정보 조회
    MapVO selectMapById(@Param("mapId") Integer mapId);
}
