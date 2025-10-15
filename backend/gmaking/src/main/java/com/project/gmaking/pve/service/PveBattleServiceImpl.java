package com.project.gmaking.pve.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.project.gmaking.character.dao.CharacterDAO;
import com.project.gmaking.character.vo.CharacterStatVO;
import com.project.gmaking.character.vo.CharacterVO;
import com.project.gmaking.map.dao.MapDAO;
import com.project.gmaking.map.vo.MapVO;
import com.project.gmaking.pve.dao.*;
import com.project.gmaking.pve.vo.*;
import jakarta.servlet.ServletOutputStream;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;


import java.io.IOException;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PveBattleServiceImpl implements PveBattleService {

    private final EncounterRateDAO encounterRateDAO;
    private final MonsterDAO monsterDAO;
    private final PveBattleDAO battleDAO;
    private final CharacterDAO characterDAO;
    private final MapDAO mapDAO;
    private final OpenAIService openAIService;
    private final TurnLogDAO turnLogDAO;

    /** 맵 목록 조회 */
    @Override
    public List<MapVO> getMaps() {
        return mapDAO.selectAllMaps();
    }

    /** 맵 ID로 데이터 조회 */
    @Override
    public MapVO getMapDataById(Integer mapId) {
        return mapDAO.selectMapById(mapId);
    }

    /** 몬스터 조우 */
    @Override
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

        return monsterDAO.getRandomMonsterByType(type);
    }

    /** GPT 기반 전투 시뮬레이션 */
    @Override
    public BattleLogVO startBattle(Integer characterId, MonsterVO monster, String userId) {
        CharacterVO character = characterDAO.selectCharacterById(characterId);
        CharacterStatVO stat = character.getCharacterStat();

        int playerHp = stat.getCharacterHp();
        int monsterHp = monster.getMonsterHp();
        int playerAtk = stat.getCharacterAttack();
        int playerDef = stat.getCharacterDefense();
        int playerSpeed = stat.getCharacterSpeed();
        int playerCrit = stat.getCriticalRate();

        int monsterAtk = monster.getMonsterAttack();
        int monsterDef = monster.getMonsterDefense();
        int monsterSpeed = monster.getMonsterSpeed();
        int monsterCrit = monster.getMonsterCriticalRate();

        boolean playerFirst = playerSpeed >= monsterSpeed;

        List<String> logs = new ArrayList<>();

        // 전투 시작 메시지
        logs.add(String.format("%s(HP:%s, 공격:%s, 방어:%s, 속도:%s, 크리티컬:%s)을 마주쳤다!",
                monster.getMonsterName(),
                String.valueOf(monster.getMonsterHp()),
                String.valueOf(monster.getMonsterAttack()),
                String.valueOf(monster.getMonsterDefense()),
                String.valueOf(monster.getMonsterSpeed()),
                String.valueOf(monster.getMonsterCriticalRate())));

        int turn = 1;
        ObjectMapper mapper = new ObjectMapper();

        while (playerHp > 0 && monsterHp > 0) {
            boolean isPlayerAttack = (turn % 2 == 1) ? playerFirst : !playerFirst;
            String actor, target;
            int atk, def, critRate;

            if (isPlayerAttack) {
                actor = character.getCharacterName(); target = monster.getMonsterName();
                atk = playerAtk; def = monsterDef; critRate = playerCrit;
            } else {
                actor = monster.getMonsterName(); target = character.getCharacterName();
                atk = monsterAtk; def = playerDef; critRate = monsterCrit;
            }

            boolean critical = Math.random() * 100 < critRate;
            int damage = Math.max(1, (critical ? atk * 2 : atk) - def);

            if (isPlayerAttack) monsterHp -= damage;
            else playerHp -= damage;

            boolean isBattleOver = (playerHp <= 0 || monsterHp <= 0);
            // GPT 호출
            String noteJson = openAIService.requestGPTNote(Map.of(
                            "actor", actor,
                            "target", target,
                            "damage", damage,
                            "critical", critical
                    ), "COMIC", isBattleOver //  기본 스타일 "COMIC"과 isBattleOver 전달
            ).join();

            // 즉시 로그 출력
            System.out.println("[턴 " + turn + "] GPT note: " + noteJson);

            // 코드블록 제거
            noteJson = noteJson.replaceAll("(?s)^```.*?```$", "").trim();

            // noteJson이 비어있으면 기본 메시지
            if (noteJson.isEmpty()) noteJson = "{\"note\":\"[GPT 호출 실패]\"}";

            // JSON 형식 강제화 (큰따옴표만 escape)
            if (!noteJson.startsWith("{")) {
                noteJson = "{\"note\":\"" + noteJson.replace("\"", "\\\"") + "\"}";
            }

            // 파싱
            Map<String, Object> noteMap;
            try {
                noteMap = mapper.readValue(noteJson, new TypeReference<Map<String, Object>>() {});
            } catch (Exception e) {
                e.printStackTrace();
                noteMap = Map.of("note", "[GPT 호출 실패]");
            }


            String noteText = noteMap.getOrDefault("note", "[GPT 호출 실패]").toString();

            String line = String.format(
                    "턴 %s: %s가 공격으로 %s 데미지를 입힘 %s%n(플레이어HP:%s, 몬스터HP:%s)%n",
                    String.valueOf(turn),
                    String.valueOf(actor),
                    String.valueOf(damage),
                    String.valueOf(noteText),
                    String.valueOf(playerHp),
                    String.valueOf(monsterHp)
            );
            logs.add(line);
            turn++;
        }

        boolean isWin = monsterHp <= 0;

        // 전투 종료 메시지
        String resultMsg = isWin ? "승리! 전투 종료!" : "패배... 다음에 다시 도전하세요!";
        logs.add(resultMsg);

        // DB 기록
        BattleLogVO battleLog = new BattleLogVO();
        battleLog.setCharacterId(character.getCharacterId());
        battleLog.setOpponentId(monster.getMonsterId());
        battleLog.setBattleType("PVE");
        battleLog.setIsWin(isWin ? "Y" : "N");
        battleLog.setTurnCount((long) (turn - 1));
        battleLog.setCreatedBy(userId);
        battleDAO.insertBattleLog(battleLog);
        Integer battleId = battleLog.getBattleId();

        // 턴 로그 DB 기록
        int turnNum = 1;
        for (String log : logs) {
            TurnLogVO turnLog = new TurnLogVO();
            turnLog.setBattleId(battleId);
            turnLog.setTurnNumber(turnNum++);
            turnLog.setActionDetail(log);
            turnLogDAO.insertTurnLog(turnLog);
        }

        // 승리 시 스테이지 클리어 증가
        if (isWin) characterDAO.incrementStageClear(character.getCharacterId());

        battleLog.setTurnLogs(logs);
        return battleLog;
    }

    @Override
    public void startBattleWebSocket(WebSocketSession session, Integer characterId, MonsterVO monster, String userId, String noteStyle) {
        try {
            CharacterVO character = characterDAO.selectCharacterById(characterId);
            CharacterStatVO stat = character.getCharacterStat();

            int playerHp = stat.getCharacterHp();
            int monsterHp = monster.getMonsterHp();
            int playerAtk = stat.getCharacterAttack();
            int playerDef = stat.getCharacterDefense();
            int playerSpeed = stat.getCharacterSpeed();
            int playerCrit = stat.getCriticalRate();

            int monsterAtk = monster.getMonsterAttack();
            int monsterDef = monster.getMonsterDefense();
            int monsterSpeed = monster.getMonsterSpeed();
            int monsterCrit = monster.getMonsterCriticalRate();

            boolean playerFirst = playerSpeed >= monsterSpeed;
            ObjectMapper mapper = new ObjectMapper();

            // 전투 기록 DB
            BattleLogVO battleLog = new BattleLogVO();
            battleLog.setCharacterId(characterId);
            battleLog.setOpponentId(monster.getMonsterId());
            battleLog.setBattleType("PVE");
            battleLog.setCreatedBy(userId);
            battleLog.setIsWin("N");
            battleLog.setTurnCount(0L);
            battleDAO.insertBattleLog(battleLog);
            Integer battleId = battleLog.getBattleId();

            // 초기 로그
            List<String> logs = new ArrayList<>();
            String initialLog = String.format("%s(HP:%s, 공격:%s, 방어:%s, 속도:%s, 크리티컬:%s)을 마주쳤다!",
                    monster.getMonsterName(), monsterHp, monsterAtk, monsterDef, monsterSpeed, monsterCrit);
            logs.add(initialLog);

            // 초기 로그 전송
            session.sendMessage(new TextMessage(initialLog));

            int turn = 1;
            while (playerHp > 0 && monsterHp > 0) {
                boolean isPlayerAttack = (turn % 2 == 1) ? playerFirst : !playerFirst;
                String actor = isPlayerAttack ? character.getCharacterName() : monster.getMonsterName();
                String target = isPlayerAttack ? monster.getMonsterName() : character.getCharacterName();
                int atk = isPlayerAttack ? playerAtk : monsterAtk;
                int def = isPlayerAttack ? monsterDef : playerDef;
                int critRate = isPlayerAttack ? playerCrit : monsterCrit;

                boolean critical = Math.random() * 100 < critRate;
                int damage = Math.max(1, (critical ? atk * 2 : atk) - def);

                if (isPlayerAttack) monsterHp -= damage;
                else playerHp -= damage;

                boolean isBattleOver = (playerHp <= 0 || monsterHp <= 0);
                String noteJson = openAIService.requestGPTNote(Map.of(
                                "actor", actor,
                                "target", target,
                                "damage", damage,
                                "critical", critical
                                // isBattleOver는 Map 대신 인자로 전달합니다.
                        ), noteStyle, isBattleOver // styleKey와 isBattleOver 인자를 전달
                ).join();

                noteJson = noteJson.replaceAll("(?s)^```json\\s*(.*?)\\s*```$", "$1")
                        .replaceAll("(?s)^```\\s*(.*?)\\s*```$", "$1").trim();
                if (noteJson.isEmpty()) noteJson = "{\"note\":\"[GPT 호출 실패]\"}";
                if (!noteJson.startsWith("{")) {
                    noteJson = "{\"note\":\"" + noteJson.replace("\"", "\\\"") + "\"}";
                }

                // JSON이 닫히지 않은 경우 복구 로직
                if (!noteJson.endsWith("}")) {
                    noteJson += "}";
                    log.warn("GPT 응답 JSON 복구됨: 닫는 괄호 '}' 추가됨");
                }
                
                Map<String, Object> noteMap;
                try {
                    noteMap = mapper.readValue(noteJson, new TypeReference<Map<String, Object>>() {});
                } catch (Exception e) {
                    noteMap = Map.of("note", "[GPT 호출 실패]");
                }
                String noteText = noteMap.getOrDefault("note", "[GPT 호출 실패]").toString();

                // 마지막 턴이면 로그에 승리/패배 메시지 포함
                String actionLog = String.format(
                        "턴 %d: %s가 공격으로 %d 데미지를 입힘%s\n%s \n(플레이어HP:%d, 몬스터HP:%d)\n%s",
                        turn,
                        actor,
                        damage,
                        critical ? " 크리티컬 히트!" : "",
                        noteText,
                        playerHp,
                        monsterHp,
                        ""
                );
                logs.add(actionLog);

                // 프론트로 전송
                session.sendMessage(new TextMessage(actionLog));

                // DB 저장
                TurnLogVO turnLog = new TurnLogVO();
                turnLog.setBattleId(battleId);
                turnLog.setTurnNumber(turn);
                turnLog.setActionDetail(actionLog);
                turnLogDAO.insertTurnLog(turnLog);

                Thread.sleep(1000);
                turn++;
            }

            boolean isWin = monsterHp <= 0;

            // 전투 종료 메시지 전송
            Map<String, Object> result = Map.of(
                    "type", "end",
                    "result", isWin ? "win" : "lose"
            );
            session.sendMessage(new TextMessage(mapper.writeValueAsString(result)));
            // DB 기록
            battleLog.setIsWin(isWin ? "Y" : "N");
            battleLog.setTurnCount((long) (turn - 1));
            battleDAO.insertBattleLog(battleLog);

            if (isWin) characterDAO.incrementStageClear(character.getCharacterId());

        } catch (Exception e) {
            try {
                session.sendMessage(new TextMessage("{\"type\":\"error\",\"msg\":\"" + e.getMessage() + "\"}"));
            } catch (IOException ex) {
                ex.printStackTrace();
            }
        }
    }

}
