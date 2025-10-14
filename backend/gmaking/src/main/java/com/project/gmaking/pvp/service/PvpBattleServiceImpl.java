package com.project.gmaking.pvp.service;


import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.gmaking.character.dao.CharacterDAO;
import com.project.gmaking.character.vo.CharacterVO;
import com.project.gmaking.pve.dao.TurnLogDAO;
import com.project.gmaking.pve.vo.TurnLogVO;
import com.project.gmaking.pve.vo.BattleLogVO;
import com.project.gmaking.pvp.dao.PvpBattleDAO;
import com.project.gmaking.pvp.vo.PvpBattleVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class PvpBattleServiceImpl implements PvpBattleService{

    private final PvpBattleDAO pvpBattleDAO;
    private final CharacterDAO characterDAO;
    private final TurnLogDAO turnLogDAO;
    private final ObjectMapper mapper;

    // 메모리 캐시용 (테스트용)
    private final List<PvpBattleVO> activeBattles = new ArrayList<>();

    @Override
    public String findRandomOpponent(String userId) {
        return pvpBattleDAO.findRandomOpponent(userId);
    }

    @Override
    public List<CharacterVO> getOpponentCharacters(String opponentId) {
        return characterDAO.selectCharactersByUser(opponentId);
    }

    // 전투 시작
    @Override
    public PvpBattleVO startBattle(Integer myCharacterId, Integer opponentCharacterId) {
        CharacterVO me = characterDAO.selectCharacterById(myCharacterId);
        CharacterVO enemy = characterDAO.selectCharacterById(opponentCharacterId);

        PvpBattleVO battle = new PvpBattleVO();
        battle.setPlayer(me);
        battle.setEnemy(enemy);
        battle.setTurn(1);
        battle.setLogs(new ArrayList<>());
        battle.setPlayerHp(me.getCharacterStat().getCharacterHp());
        battle.setEnemyHp(enemy.getCharacterStat().getCharacterHp());

        // DB에 배틀 로그 insert 후 생성된 BATTLE_ID 가져오기
        BattleLogVO battleLog = new BattleLogVO();
        battleLog.setCharacterId(me.getCharacterId());
        battleLog.setBattleType("PVP");
        battleLog.setOpponentId(enemy.getCharacterId());
        battleLog.setIsWin("N");
        battleLog.setTurnCount(0L);
        battleLog.setCreatedBy(me.getUserId());

        pvpBattleDAO.insertBattleLog(battleLog); // MyBatis에서 useGeneratedKeys=true로 BATTLE_ID 반환
        battle.setBattleId(battleLog.getBattleId()); // DB에서 생성된 ID 사용

        // 메모리 캐시에도 저장 (테스트용)
        activeBattles.add(battle);

        return battle;
    }

    // battleId로 전투 상태 조회 (컨트롤러에서 사용)
    public PvpBattleVO getBattleById(Integer battleId) {
        return activeBattles.stream()
                .filter(b -> b.getBattleId().equals(battleId))
                .findFirst()
                .orElse(null);
    }

    // 턴 진행 (커맨드 계산)
    @Override
    public PvpBattleVO processTurn(PvpBattleVO battle, String myCommand) {
        // 이미 종료된 배틀이면 진행 차단
        if (battle == null || battle.isBattleOver()) return battle;

        String[] commands = {"attack", "defense", "evade", "ultimate"};
        String enemyCommand = commands[new Random().nextInt(commands.length)];
        battle.setEnemyCommand(enemyCommand);

        int playerDamage = 0, enemyDamage = 0;

        int atk = battle.getPlayer().getCharacterStat().getCharacterAttack();
        int def = battle.getPlayer().getCharacterStat().getCharacterDefense();
        int eAtk = battle.getEnemy().getCharacterStat().getCharacterAttack();
        int eDef = battle.getEnemy().getCharacterStat().getCharacterDefense();

        // ==== 상성 규칙 ====
        if (myCommand.equals("attack") && enemyCommand.equals("evade")) enemyDamage = atk;
        else if (myCommand.equals("defense") && enemyCommand.equals("attack")) enemyDamage = def * 2;
        else if (myCommand.equals("evade") && enemyCommand.equals("ultimate")) enemyDamage = def * 3;
        else if (myCommand.equals("ultimate") &&
                (enemyCommand.equals("attack") || enemyCommand.equals("defense"))) enemyDamage = atk * 2;
        else if (enemyCommand.equals("attack") && myCommand.equals("evade")) playerDamage = eAtk;
        else if (enemyCommand.equals("defense") && myCommand.equals("attack")) playerDamage = eDef * 2;
        else if (enemyCommand.equals("evade") && myCommand.equals("ultimate")) playerDamage = eDef * 3;
        else if (enemyCommand.equals("ultimate") &&
                (myCommand.equals("attack") || myCommand.equals("defense"))) playerDamage = eAtk * 2;
        else if (myCommand.equals(enemyCommand) && (myCommand.equals("attack") || myCommand.equals("ultimate"))) {
            playerDamage = eAtk;
            enemyDamage = atk;
        }

        // === HP 갱신 ===
        battle.setPlayerHp(Math.max(0, battle.getPlayerHp() - playerDamage));
        battle.setEnemyHp(Math.max(0, battle.getEnemyHp() - enemyDamage));

        // ==== GPT 요청용 로그 생성 ====
        String actionLog = String.format(
                "플레이어는 %s / 상대는 %s 행동을 했다. 피해: 플레이어=%d, 상대=%d",
                myCommand, enemyCommand, playerDamage, enemyDamage
        );

        // DB에는 이번 턴 로그만 저장
        turnLogDAO.insertTurnLog(new TurnLogVO(null, battle.getBattleId(), battle.getTurn(), actionLog, LocalDateTime.now()));

        // 프론트용 누적 로그
        battle.getLogs().add(actionLog);

        // 턴 증가 및 종료 체크
        battle.setTurn(battle.getTurn() + 1);
        // 종료 체크
        if (battle.getPlayerHp() <= 0 || battle.getEnemyHp() <= 0) {
            battle.setBattleOver(true);
        }

        return battle;
    }


    // 전투 종료
    @Override
    public void endBattle(PvpBattleVO result) {
        boolean isWin = result.getEnemyHp() <= 0;
        BattleLogVO log = new BattleLogVO(
                null,
                result.getPlayer().getCharacterId(),
                "PVP",
                result.getEnemy().getCharacterId(),
                isWin ? "Y" : "N",
                (long) result.getTurn(),
                LocalDateTime.now(),
                result.getPlayer().getUserId(),
                null,
                null,
                result.getLogs()
        );
        pvpBattleDAO.insertBattleLog(log);
    }
}
