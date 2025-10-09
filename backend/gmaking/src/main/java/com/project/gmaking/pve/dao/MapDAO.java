package com.project.gmaking.pve.dao;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import com.project.gmaking.pve.vo.MapVO;

@Mapper
public interface MapDAO {
    List<MapVO> selectAllMaps();
}
