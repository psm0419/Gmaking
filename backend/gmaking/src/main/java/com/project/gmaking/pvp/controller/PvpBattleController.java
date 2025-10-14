package com.project.gmaking.pvp.controller;

import com.project.gmaking.character.vo.CharacterVO;
import com.project.gmaking.pvp.service.PvpBattleService;
import com.project.gmaking.pvp.vo.PvpBattleVO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pvp")
@RequiredArgsConstructor
public class PvpBattleController {

    private final PvpBattleService pvpBattleService;

    // 상대방 찾기
    @GetMapping("/match")
    public ResponseEntity<?> findOpponent(@RequestParam String userId) {
        String opponentId = pvpBattleService.findRandomOpponent(userId);
        if (opponentId == null) {
            return ResponseEntity.badRequest().body("매칭 가능한 상대가 없습니다.");
        }

        List<CharacterVO> opponentChars = pvpBattleService.getOpponentCharacters(opponentId);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("opponentId", opponentId);
        result.put("characters", opponentChars);

        return ResponseEntity.ok(result);
    }

    // 전투 시작
    @PostMapping("/battle")
    public ResponseEntity<?> startBattle(@RequestBody Map<String, Integer> request) {
        Integer myCharId = request.get("myCharacterId");
        Integer enemyCharId = request.get("enemyCharacterId");

        PvpBattleVO battle = pvpBattleService.startBattle(myCharId, enemyCharId);

        Map<String, Object> result = new HashMap<>();
        result.put("battleId", battle.getBattleId());
        result.put("log", battle.getLogs());

        return ResponseEntity.ok(result);
    }

    @PostMapping("/turn")
    public ResponseEntity<?> processTurn(@RequestBody Map<String, Object> request) {
        Integer battleId = (Integer) request.get("battleId");
        String myCommand = (String) request.get("command");

        PvpBattleVO battle = pvpBattleService.getBattleById(battleId);
        if (battle == null) return ResponseEntity.badRequest().body("배틀 정보를 찾을 수 없습니다.");

        if (battle.isBattleOver()) {
            battle.setEnemyCommand(""); // 중앙 표시 초기화
            return ResponseEntity.ok(battle);
        }

        PvpBattleVO updatedBattle = pvpBattleService.processTurn(battle, myCommand);
        return ResponseEntity.ok(updatedBattle);
    }


}
