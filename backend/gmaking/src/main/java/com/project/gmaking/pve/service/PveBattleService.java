package com.project.gmaking.pve.service;

import java.util.*;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;

import com.project.gmaking.pve.service.OpenAIService;
import com.project.gmaking.pve.dao.BattleDAO;
import com.project.gmaking.pve.dao.EncounterRateDAO;
import com.project.gmaking.pve.dao.MonsterDAO;
import com.project.gmaking.character.dao.CharacterStatDAO;
import com.project.gmaking.character.dao.CharacterDAO;
import com.project.gmaking.map.dao.MapDAO;
import com.project.gmaking.pve.dao.TurnLogDAO;
import com.project.gmaking.pve.vo.BattleLogVO;
import com.project.gmaking.pve.vo.TurnLogVO;
import com.project.gmaking.pve.vo.EncounterRateVO;
import com.project.gmaking.character.vo.CharacterStatVO;
import com.project.gmaking.pve.vo.MonsterVO;
import com.project.gmaking.map.vo.MapVO;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class PveBattleService {

    private final EncounterRateDAO encounterRateDAO;
    private final MonsterDAO monsterDAO;
    private final CharacterStatDAO characterStatDAO;
    private final BattleDAO battleDAO;
    private final CharacterDAO characterDAO;
    private final MapDAO mapDAO;
    private final OpenAIService openAIService;
    private final TurnLogDAO turnLogDAO;

//      맵 선택
    public List<MapVO> getMaps() {
        return mapDAO.selectAllMaps();
    }

    // 맵 ID로 이미지 URL 조회
    public String getMapImageUrl(Integer mapId) {
        // DAO를 호출하여 MapVO 전체를 가져온 뒤, URL만 추출
        MapVO map = mapDAO.selectMapById(mapId);

        // 맵 정보가 null이 아니면 이미지 URL을 반환하고, 없으면 빈 문자열 또는 기본 URL 반환
        return (map != null) ? map.getMapImageUrl() : "";
    }
//    몬스터 조우
    public MonsterVO encounterMonster(Integer mapId) {
        List<EncounterRateVO> rates = encounterRateDAO.getEncounterRates();

        double normalRate = rates.stream()
                .filter(r -> r.getEncounterType().equalsIgnoreCase("NORMAL"))
                .mapToDouble(EncounterRateVO::getEncounterRate)
                .findFirst()
                .orElse(98.0);

        double bossRate = 100.0 - normalRate;
        double random = Math.random() * 100;

        String type = random < bossRate ? "BOSS" : "NORMAL";

        // mapId는 지금은 사용 안하지만, 나중에 맵별로 로직 확장 가능
        return monsterDAO.getRandomMonsterByType(type);
    }

    // GPT 기반 자동 전투 시뮬레이션
    public BattleLogVO startBattle(Integer characterId, MonsterVO monster, String userId) {
        CharacterStatVO stat = characterStatDAO.getCharacterStat(characterId);

        // GPT로 전달할 데이터 구성
        Map<String, Object> playerMap = Map.of(
                "name", stat.getCharacter().getCharacterName(),
                "hp", stat.getCharacterHp(),
                "attack", stat.getCharacterAttack(),
                "defense", stat.getCharacterDefense(),
                "speed", stat.getCharacterSpeed(),
                "criticalRate", stat.getCriticalRate()
        );

        Map<String, Object> monsterMap = Map.of(
                "name", monster.getMonsterName(),
                "hp", monster.getMonsterHp(),
                "attack", monster.getMonsterAttack(),
                "defense", monster.getMonsterDefense(),
                "speed", monster.getMonsterDefense(), // speed 없으므로 임시로 defense로 대체
                "criticalRate", monster.getMonsterCriticalRate()
        );

        // GPT 호출
        List<String> turnLogs = openAIService.generateBattleLog(playerMap, monsterMap);

        // 승패 판정 (마지막 로그의 HP 기준)
        String lastLog = turnLogs.get(turnLogs.size() - 1);
        boolean isWin = lastLog.contains("몬스터HP:0") || lastLog.contains("몬스터HP:0.0");

        // DB 저장
        BattleLogVO log = new BattleLogVO();
        log.setCharacterId(characterId);
        log.setOpponentId(monster.getMonsterId());
        log.setBattleType("PVE");
        log.setIsWin(isWin ? "Y" : "N");
        log.setTurnCount((long) turnLogs.size());
        log.setCreatedBy(userId);

        battleDAO.insertBattleLog(log);

        // ===== 배틀 ID 가져와서 턴 로그 저장 =====
        Integer battleId = log.getBattleId(); // Mapper에서 useGeneratedKeys 설정 필요
        int turnNum = 1;
        for (String turnDetail : turnLogs) {
            TurnLogVO turnLog = new TurnLogVO();
            turnLog.setBattleId(battleId);
            turnLog.setTurnNumber(turnNum++);
            turnLog.setActionDetail(turnDetail);
            turnLogDAO.insertTurnLog(turnLog);
        }

        if (isWin) {
            characterDAO.incrementStageClear(characterId);
        }

        // 프론트 표시용
        log.setTurnLogs(turnLogs);

        return log;
    }

}
