package com.project.gmaking.pve.service;

import java.util.List;
import com.project.gmaking.map.vo.MapVO;
import com.project.gmaking.pve.vo.BattleLogVO;
import com.project.gmaking.pve.vo.MonsterVO;
import org.springframework.web.socket.WebSocketSession;

public interface PveBattleService {

    // 맵 관련
    List<MapVO> getMaps();
    MapVO getMapDataById(Integer mapId);

    // 몬스터 조우
    MonsterVO encounterMonster(Integer mapId);

    // 전투
    BattleLogVO startBattle(Integer characterId, MonsterVO monster, String userId);

    void startBattleWebSocket(WebSocketSession session, Integer characterId, MonsterVO monster, String userId, String noteStyle);
}
