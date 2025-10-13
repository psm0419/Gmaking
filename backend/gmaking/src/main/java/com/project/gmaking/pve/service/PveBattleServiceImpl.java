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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
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

            // GPT 호출
            String noteJson = openAIService.requestGPTNote(Map.of(
                    "actor", actor,
                    "target", target,
                    "damage", damage,
                    "critical", critical
            )).join();

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
    public void startBattleStream(Integer characterId, Integer mapId, String userId, SseEmitter emitter) {
        MonsterVO monster = encounterMonster(mapId);
        CharacterVO character = characterDAO.selectCharacterById(characterId);
        CharacterStatVO stat = character.getCharacterStat();

        if (character == null || stat == null) {
            try {
                emitter.send(SseEmitter.event()
                        .name("error")
                        .data("캐릭터 정보를 불러오지 못했습니다."));
                emitter.complete();
            } catch (IOException e) {
                log.error("SSE 에러: 캐릭터 정보 전송 실패", e);
                emitter.completeWithError(e);
            }
            return;
        }

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
        String initialLog = String.format("%s(HP:%s, 공격:%s, 방어:%s, 속도:%s, 크리티컬:%s)을 마주쳤다!",
                monster.getMonsterName(),
                String.valueOf(monster.getMonsterHp()),
                String.valueOf(monster.getMonsterAttack()),
                String.valueOf(monster.getMonsterDefense()),
                String.valueOf(monster.getMonsterSpeed()),
                String.valueOf(monster.getMonsterCriticalRate()));
        logs.add(initialLog);

        // 초기 로그 전송
        try {
            emitter.send(SseEmitter.event()
                    .name("turnLog")
                    .data(initialLog));
            Thread.sleep(500); // 클라이언트가 이벤트를 처리할 시간 확보
        } catch (IOException e) {
            log.error("SSE 초기 로그 전송 실패", e);
            emitter.completeWithError(e);
            return;
        } catch (InterruptedException e) {
            log.error("Thread sleep 에러", e);
            emitter.completeWithError(e);
            return;
        }

        int turn = 1;
        ObjectMapper mapper = new ObjectMapper();

        BattleLogVO battleLog = new BattleLogVO();
        battleLog.setCharacterId(character.getCharacterId());
        battleLog.setOpponentId(monster.getMonsterId());
        battleLog.setBattleType("PVE");
        battleLog.setCreatedBy(userId);

        while (playerHp > 0 && monsterHp > 0) {
            boolean isPlayerAttack = (turn % 2 == 1) ? playerFirst : !playerFirst;
            String actor, target;
            int atk, def, critRate;

            if (isPlayerAttack) {
                actor = character.getCharacterName();
                target = monster.getMonsterName();
                atk = playerAtk;
                def = monsterDef;
                critRate = playerCrit;
            } else {
                actor = monster.getMonsterName();
                target = character.getCharacterName();
                atk = monsterAtk;
                def = playerDef;
                critRate = monsterCrit;
            }

            boolean critical = Math.random() * 100 < critRate;
            int damage = Math.max(1, (critical ? atk * 2 : atk) - def);

            if (isPlayerAttack) monsterHp -= damage;
            else playerHp -= damage;

            String noteJson;
            try {
                noteJson = openAIService.requestGPTNote(Map.of(
                        "actor", actor,
                        "target", target,
                        "damage", damage,
                        "critical", critical
                )).join();
            } catch (Exception e) {
                log.error("GPT 호출 실패: 턴 {}", turn, e);
                noteJson = "{\"note\":\"[GPT 호출 실패: 서버 오류]\"}";
            }

            System.out.println("[턴 " + turn + "] GPT 원본 응답: " + noteJson);

            // 코드 블록 제거 및 JSON 정리
            noteJson = noteJson.replaceAll("(?s)^```json\\s*(.*?)\\s*```$", "$1")
                    .replaceAll("(?s)^```\\s*(.*?)\\s*```$", "$1")
                    .trim();
            if (noteJson.isEmpty()) noteJson = "{\"note\":\"[GPT 호출 실패]\"}";
            if (!noteJson.startsWith("{")) {
                noteJson = "{\"note\":\"" + noteJson.replace("\"", "\\\"") + "\"}";
            }

            Map<String, Object> noteMap;
            try {
                noteMap = mapper.readValue(noteJson, new TypeReference<Map<String, Object>>() {});
            } catch (Exception e) {
                log.error("GPT 응답 파싱 실패: {}", noteJson, e);
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

            // 턴 로그 스트리밍
            try {
                emitter.send(SseEmitter.event()
                        .name("turnLog")
                        .data(line));
                Thread.sleep(500); // 실시간감 조절을 위한 짧은 지연
            } catch (IOException e) {
                log.error("SSE 턴 로그 전송 실패: 턴 {}", turn, e);
                emitter.completeWithError(e);
                return;
            } catch (InterruptedException e) {
                log.error("Thread sleep 에러: 턴 {}", turn, e);
                emitter.completeWithError(e);
                return;
            }

            turn++;
        }

        boolean isWin = monsterHp <= 0;
        String resultMsg = isWin ? "승리! 전투 종료!" : "패배... 다음에 다시 도전하세요!";
        logs.add(resultMsg);

        // 전투 결과 스트리밍
        try {
            emitter.send(SseEmitter.event()
                    .name("battleResult")
                    .data(Map.of("isWin", isWin ? "Y" : "N", "message", resultMsg)));
        } catch (IOException e) {
            log.error("SSE 전투 결과 전송 실패", e);
            emitter.completeWithError(e);
            return;
        }

        // DB 저장
        battleLog.setIsWin(isWin ? "Y" : "N");
        battleLog.setTurnCount((long) (turn - 1));
        battleDAO.insertBattleLog(battleLog);
        Integer battleId = battleLog.getBattleId();

        int turnNum = 1;
        for (String log : logs) {
            TurnLogVO turnLog = new TurnLogVO();
            turnLog.setBattleId(battleId);
            turnLog.setTurnNumber(turnNum++);
            turnLog.setActionDetail(log);
            turnLogDAO.insertTurnLog(turnLog);
        }

        if (isWin) characterDAO.incrementStageClear(character.getCharacterId());

        // 스트림 종료
        emitter.complete();
    }
}
