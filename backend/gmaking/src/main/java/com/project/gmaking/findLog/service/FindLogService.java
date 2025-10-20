package com.project.gmaking.findLog.service;

import com.project.gmaking.pve.vo.BattleLogVO;
import com.project.gmaking.pve.vo.TurnLogVO;

import java.util.List;

public interface FindLogService {
    // 특정 유저의 배틀 로그 목록 조회
    List<BattleLogVO> getBattleLogsByUser(String userId);

    // 특정 배틀의 턴 로그 조회
    List<TurnLogVO> getTurnLogsByBattleId(Integer battleId);
}
