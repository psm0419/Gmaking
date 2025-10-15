package com.project.gmaking.pvp.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.gmaking.character.dao.CharacterDAO;
import com.project.gmaking.character.vo.CharacterVO;
import com.project.gmaking.pve.dao.TurnLogDAO;
import com.project.gmaking.pve.service.OpenAIService;
import com.project.gmaking.pve.vo.TurnLogVO;
import com.project.gmaking.pve.vo.BattleLogVO;
import com.project.gmaking.pvp.dao.PvpBattleDAO;
import com.project.gmaking.pvp.vo.PvpBattleVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

@Service
@RequiredArgsConstructor
public class PvpBattleServiceImpl implements PvpBattleService{

    private final PvpBattleDAO pvpBattleDAO;
    private final CharacterDAO characterDAO;
    private final TurnLogDAO turnLogDAO;
    private final ObjectMapper mapper;
    private final OpenAIService openAIService;

    // 메모리 캐시용
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

    // 한글 커맨드 정의
    private static final String[] COMMANDS = {"공격", "방어", "회피", "필살기"}; // 커맨드 목록을 상수로 정의
    
    // 턴 진행 (커맨드 계산)
    @Override
    public PvpBattleVO processTurn(PvpBattleVO battle, String myCommand) {
        // 이미 종료된 배틀이면 진행 차단
        if (battle == null || battle.isBattleOver()) return battle;

        String enemyCommand = COMMANDS[new Random().nextInt(COMMANDS.length)];
        battle.setEnemyCommand(enemyCommand);

        int playerDamage = 0, enemyDamage = 0;

        int atk = battle.getPlayer().getCharacterStat().getCharacterAttack();
        int def = battle.getPlayer().getCharacterStat().getCharacterDefense();
        int eAtk = battle.getEnemy().getCharacterStat().getCharacterAttack();
        int eDef = battle.getEnemy().getCharacterStat().getCharacterDefense();

        // ==== 상성 규칙 ====
        if (myCommand.equals("공격") && enemyCommand.equals("회피")) enemyDamage = atk;
        else if (myCommand.equals("방어") && enemyCommand.equals("공격")) enemyDamage = def * 2;
        else if (myCommand.equals("회피") && enemyCommand.equals("필살기")) enemyDamage = def * 3;
        else if (myCommand.equals("필살기") &&
                (enemyCommand.equals("공격") || enemyCommand.equals("방어"))) enemyDamage = atk * 2;
        else if (enemyCommand.equals("공격") && myCommand.equals("회피")) playerDamage = eAtk;
        else if (enemyCommand.equals("방어") && myCommand.equals("공격")) playerDamage = eDef * 2;
        else if (enemyCommand.equals("회피") && myCommand.equals("필살기")) playerDamage = eDef * 3;
        else if (enemyCommand.equals("필살기") &&
                (myCommand.equals("공격") || myCommand.equals("방어"))) playerDamage = eAtk * 2;
        else if (myCommand.equals(enemyCommand) && (myCommand.equals("공격") || myCommand.equals("필살기"))) {
            playerDamage = eAtk;
            enemyDamage = atk;
        }

        // === HP 갱신 ===
        battle.setPlayerHp(Math.max(0, battle.getPlayerHp() - playerDamage));
        battle.setEnemyHp(Math.max(0, battle.getEnemyHp() - enemyDamage));

        // 1단계: 서버 계산 결과 로그 생성 (GPT 비의존)
        // ----------------------------------------------------
        String resultLog = String.format(
                "[%s의 %s]가 [%s의 %s]에게 입힌 피해: %d. 받은 피해: %d",
                battle.getPlayer().getCharacterName(), myCommand,
                battle.getEnemy().getCharacterName(), enemyCommand,
                enemyDamage, playerDamage
        );

        // 2단계: GPT 해설 로그 생성 및 결합
        // ----------------------------------------------------
        Map<String, Object> gptData = Map.of(
                "player", battle.getPlayer().getCharacterName(),
                "enemy", battle.getEnemy().getCharacterName(),
                "playerCommand", myCommand,
                "enemyCommand", enemyCommand,
                "playerDamage", playerDamage,
                "enemyDamage", enemyDamage
        );

        // 비동기 GPT 호출
        CompletableFuture<String> gptNoteFuture = openAIService.requestGPTPvpNote(gptData);
        String gptLog = "";
        String finalLog = "";

        try {
            String gptNoteJson = gptNoteFuture.get();

            // JSON 문자열 정리: 코드 블록 마크다운과 서문 제거 (가장 중요!)
            String cleanJson = gptNoteJson
                    .replaceAll("```json", "") // 마크다운 시작 태그 제거
                    .replaceAll("```", "")      // 마크다운 끝 태그 및 일반 코드 블록 마크다운 제거
                    .trim();                    // 앞뒤 공백 및 줄바꿈 제거

            // 파싱 시도 (cleanJson 사용)
            JsonNode rootNode = mapper.readTree(cleanJson);
            gptLog = rootNode.path("note").asText();

            if (gptLog.isEmpty()) {
                // 'note' 필드가 없거나 비어있는 경우
                gptLog = "[GPT 해설 실패: note 필드 없음/비어있음] 원본: " + gptNoteJson;
            }

            // 최종 로그 결합: 서버 결과 + GPT 해설
            finalLog = resultLog + "\n" + gptLog;

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            finalLog = resultLog + " | 해설: [GPT 통신 오류: 스레드 중단]";
        } catch (ExecutionException e) {
            finalLog = resultLog + " | 해설: [GPT 통신 오류: 실행 예외] " + e.getCause().getMessage();
        } catch (Exception e) {
            // 이 부분이 JSON 파싱 오류를 잡는 곳입니다.
            finalLog = resultLog + " | 해설: [JSON 파싱 오류] 원본 응답 확인 필요";
        }

        // 3단계: 로그 저장 및 업데이트
        // DB에는 최종 결합 로그만 저장
        turnLogDAO.insertTurnLog(new TurnLogVO(null, battle.getBattleId(), battle.getTurn(), finalLog, LocalDateTime.now()));

        // 프론트용 누적 로그
        battle.getLogs().add(finalLog);

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
