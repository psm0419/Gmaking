package com.project.gmaking.pve.dao;
import org.apache.ibatis.annotations.Mapper;
import com.project.gmaking.pve.vo.BattleLogVO;

import java.util.List;

@Mapper
public interface PveBattleDAO {

    void insertBattleLog(BattleLogVO battleLog);
    void updateBattleLogResult(BattleLogVO battleLog);

    // 캐릭터 ID로 배틀 로그 조회
    List<BattleLogVO> selectBattleLogsByCharacterId(Integer characterId);
}
