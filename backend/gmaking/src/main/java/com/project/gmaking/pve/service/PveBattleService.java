package com.project.gmaking.pve.service;

import java.io.PrintWriter;
import java.util.List;
import com.project.gmaking.map.vo.MapVO;
import com.project.gmaking.pve.vo.BattleLogVO;
import com.project.gmaking.pve.vo.MonsterVO;
import jakarta.servlet.ServletOutputStream;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.web.socket.WebSocketSession;

public interface PveBattleService {

    // 맵 관련
    List<MapVO> getMaps();
    MapVO getMapDataById(Integer mapId);

    // 몬스터 조우
    MonsterVO encounterMonster(Integer mapId);

    // 전투
    BattleLogVO startBattle(Integer characterId, MonsterVO monster, String userId);

    void startBattleStreamWithOutputStream(Integer characterId, Integer mapId,
                                           String userId, ServletOutputStream out);

    void startBattleWebSocket(WebSocketSession session, Integer characterId, MonsterVO monster, String userId);
}
