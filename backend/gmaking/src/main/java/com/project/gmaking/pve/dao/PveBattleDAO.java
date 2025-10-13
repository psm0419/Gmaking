package com.project.gmaking.pve.dao;
import org.apache.ibatis.annotations.Mapper;
import com.project.gmaking.pve.vo.BattleLogVO;

@Mapper
public interface PveBattleDAO {

    void insertBattleLog(BattleLogVO battleLog);
}
