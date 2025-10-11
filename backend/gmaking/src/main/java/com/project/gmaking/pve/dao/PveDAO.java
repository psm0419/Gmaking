package com.project.gmaking.pve.dao;

import com.project.gmaking.character.vo.CharacterVO;
import com.project.gmaking.map.vo.MapVO;
import com.project.gmaking.pve.vo.*;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface PveDAO {
    List<MapVO> selectMaps();
    CharacterVO selectCharacterByUserId(@Param("userId") String userId);
    List<MonsterVO> selectMonstersByMapAndType(@Param("mapId") Integer mapId, @Param("isBoss") Boolean isBoss);
    MonsterVO selectMonsterById(@Param("monsterId") Integer monsterId);
    int insertBattleRecord(@Param("userId") String userId,
                           @Param("charId") Integer charId,
                           @Param("monsterId") Integer monsterId,
                           @Param("mapId") Integer mapId,
                           @Param("result") String result,
                           @Param("logs") String logs);
}
