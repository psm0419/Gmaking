package com.project.gmaking.pve.service;

import java.util.*;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;


import com.project.gmaking.pve.dao.BattleDAO;
import com.project.gmaking.pve.dao.EncounterRateDAO;
import com.project.gmaking.pve.dao.MonsterDAO;
import com.project.gmaking.character.dao.CharacterStatDAO;
import com.project.gmaking.character.dao.CharacterDAO;
import com.project.gmaking.pve.dao.MapDAO;
import com.project.gmaking.pve.vo.BattleLogVO;
import com.project.gmaking.pve.vo.EncounterRateVO;
import com.project.gmaking.character.vo.CharacterStatVO;
import com.project.gmaking.pve.vo.MonsterVO;
import com.project.gmaking.pve.vo.MapVO;


@Service
@RequiredArgsConstructor
public class PveBattleService {

    private final EncounterRateDAO encounterRateDAO;
    private final MonsterDAO monsterDAO;
    private final CharacterStatDAO characterStatDAO;
    private final BattleDAO battleDAO;
    private final CharacterDAO characterDAO;
    private final MapDAO mapDAO;

//      맵 선택
    public List<MapVO> getMaps() {
        return mapDAO.selectAllMaps();
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

        // 🔹 mapId는 지금은 사용 안하지만, 나중에 맵별로 로직 확장 가능
        return monsterDAO.getRandomMonsterByType(type);
    }

//    자동 전투 시뮬레이션
public BattleLogVO startBattle(Integer characterId, MonsterVO monster, String userId) {
    CharacterStatVO stat = characterStatDAO.getCharacterStat(characterId);

    List<String> turnLogs = new ArrayList<>();

    int turn = 0;
    boolean isPlayerTurn = stat.getCharacterSpeed() >= monster.getMonsterDefense();
    int playerHp = stat.getCharacterHp();
    int monsterHp = monster.getMonsterHp();

    while (playerHp > 0 && monsterHp > 0) {
        turn++;
        if (isPlayerTurn) {
            boolean critical = Math.random() * 100 < stat.getCriticalRate();
            int damage = Math.max(1, stat.getCharacterAttack() - monster.getMonsterDefense());
            if (critical) damage *= 2;
            monsterHp -= damage;
            turnLogs.add("턴 " + turn + ": 플레이어가 " + monster.getMonsterName() + "에게 " +
                    damage + " 데미지를 입혔습니다" + (critical ? " (크리티컬!)" : "") + ".");
        } else {
            boolean critical = Math.random() * 100 < monster.getMonsterCriticalRate();
            int damage = Math.max(1, monster.getMonsterAttack() - stat.getCharacterDefense());
            if (critical) damage *= 2;
            playerHp -= damage;
            turnLogs.add("턴 " + turn + ": " + monster.getMonsterName() + "이(가) 플레이어에게 " +
                    damage + " 데미지를 입혔습니다" + (critical ? " (크리티컬!)" : "") + ".");
        }
        isPlayerTurn = !isPlayerTurn;
    }

    boolean isWin = playerHp > 0;
    turnLogs.add(isWin ? "🎉 전투에서 승리했습니다!" : "💀 패배했습니다...");

    // 로그 DB 저장
    BattleLogVO log = new BattleLogVO();
    log.setCharacterId(characterId);
    log.setOpponentId(monster.getMonsterId());
    log.setBattleType("PVE");
    log.setIsWin(isWin ? "Y" : "N");
    log.setTurnCount((long) turn);
    log.setCreatedBy(userId);

    battleDAO.insertBattleLog(log);

    if (isWin) {
        characterDAO.incrementStageClear(characterId);
    }

    // 프론트에서 턴별 로그를 표시하기 위해 추가
    log.setTurnLogs(turnLogs);

    return log;
}

}
