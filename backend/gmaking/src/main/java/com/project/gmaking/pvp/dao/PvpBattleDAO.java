package com.project.gmaking.pvp.dao;

import com.project.gmaking.pve.vo.BattleLogVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface PvpBattleDAO {

    // 내 userId 제외하고 랜덤 유저 1명 추출
    @Select("""
        SELECT USER_ID
        FROM TB_USER
        WHERE USER_ID != #{userId}
        ORDER BY RAND()
        LIMIT 1
    """)
    String findRandomOpponent(String userId);

    // 배틀 로그 등록
    void insertBattleLog(BattleLogVO battleLog);

    // 배틀 로그 결과 업데이트 (전투 종료 시)
    void updateBattleLogResult(BattleLogVO battleLog);
}
