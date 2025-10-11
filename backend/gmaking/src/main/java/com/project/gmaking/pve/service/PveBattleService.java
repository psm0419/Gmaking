package com.project.gmaking.pve.service;

import java.util.*;

import com.project.gmaking.character.vo.CharacterVO;
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

    // (추가) 맵 ID로 MapVO 전체를 조회하는 메서드
    public MapVO getMapDataById(Integer mapId) {
        // MapDAO를 사용하여 맵 정보를 조회합니다.
        return mapDAO.selectMapById(mapId);
    }

//    // 맵 ID로 이미지 URL 조회
//    public String getMapImageUrl(Integer mapId) {
//        // DAO를 호출하여 MapVO 전체를 가져온 뒤, URL만 추출
//        MapVO map = mapDAO.selectMapById(mapId);
//
//        // 맵 정보가 null이 아니면 이미지 URL을 반환하고, 없으면 빈 문자열 또는 기본 URL 반환
//        return (map != null) ? map.getMapImageUrl() : "";
//    }
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
        // CharacterVO + CharacterStatVO를 한 번에 가져오기
        CharacterVO character = characterDAO.selectCharacterById(characterId);

        // 캐릭터 스탯
        CharacterStatVO stat = character.getCharacterStat();

        // GPT로 전달할 데이터 구성
        Map<String, Object> playerMap = Map.of(
                "name", character.getCharacterName(),
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
                "speed", monster.getMonsterSpeed(),
                "criticalRate", monster.getMonsterCriticalRate()
        );

        // GPT 호출
        List<String> turnLogs = openAIService.generateBattleLog(playerMap, monsterMap);

        // 승패 판정 (마지막 로그의 HP 기준)
        String lastLog = turnLogs.get(turnLogs.size() - 1);
        Double monsterFinalHp = extractMonsterHp(lastLog);

        // 몬스터의 최종 HP가 0 이하인지 확인
        boolean isWin = monsterFinalHp != null && monsterFinalHp <= 0.0;

        // DB 저장
        BattleLogVO battleLog = new BattleLogVO();
        battleLog.setCharacterId(character.getCharacterId());
        battleLog.setOpponentId(monster.getMonsterId());
        battleLog.setBattleType("PVE");
        battleLog.setIsWin(isWin ? "Y" : "N");
        battleLog.setTurnCount((long) turnLogs.size());
        battleLog.setCreatedBy(userId);

        battleDAO.insertBattleLog(battleLog);

        // ===== 배틀 ID 가져와서 턴 로그 저장 =====
        Integer battleId = battleLog.getBattleId(); // Mapper에서 useGeneratedKeys 설정 필요
        int turnNum = 1;
        for (String turnDetail : turnLogs) {
            TurnLogVO turnLog = new TurnLogVO();
            turnLog.setBattleId(battleId);
            turnLog.setTurnNumber(turnNum++);
            turnLog.setActionDetail(turnDetail);
            turnLogDAO.insertTurnLog(turnLog);
        }

        if (isWin) {
            characterDAO.incrementStageClear(character.getCharacterId());
        }

        // 프론트 표시용
        battleLog.setTurnLogs(turnLogs);

        return battleLog;
    }

    private Double extractMonsterHp(String logDetail) {
        // 1. "몬스터HP:" 다음부터 쉼표나 괄호가 나오기 전까지의 문자열을 찾습니다.
        try {
            int startIndex = logDetail.indexOf("몬스터HP:") + "몬스터HP:".length();
            int endIndex = logDetail.indexOf(')', startIndex);

            // 쉼표가 먼저 나오면 쉼표까지 자릅니다.
            int commaIndex = logDetail.indexOf(',', startIndex);
            if (commaIndex != -1 && commaIndex < endIndex) {
                endIndex = commaIndex;
            }

            if (startIndex > -1 && endIndex > -1) {
                String hpStr = logDetail.substring(startIndex, endIndex).trim();
                return Double.parseDouble(hpStr);
            }
        } catch (Exception e) {
            log.error("전투 로그에서 몬스터 HP 추출 실패: {}", logDetail, e);
        }
        return null; // 추출 실패 시
    }
}
