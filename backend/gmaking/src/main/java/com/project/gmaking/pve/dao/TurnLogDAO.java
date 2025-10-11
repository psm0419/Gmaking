package com.project.gmaking.pve.dao;

import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import com.project.gmaking.pve.vo.TurnLogVO;

@Mapper
public interface TurnLogDAO {
    void insertTurnLog(TurnLogVO turnLog);
    List<TurnLogVO> selectTurnLogsByBattleId(Integer battleId);
}
