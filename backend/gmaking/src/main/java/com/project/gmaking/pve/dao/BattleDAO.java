package com.project.gmaking.pve.dao;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.project.gmaking.pve.vo.BattleLogVO;

@Mapper
public interface BattleDAO {

    void insertBattleLog(BattleLogVO battleLog);
}
