package com.project.gmaking.pve.controller;

import com.project.gmaking.character.service.CharacterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

import com.project.gmaking.pve.service.PveBattleService;
import com.project.gmaking.character.service.CharacterService;
import com.project.gmaking.pve.vo.MonsterVO;
import com.project.gmaking.pve.vo.BattleLogVO;
import com.project.gmaking.pve.vo.MapVO;
import com.project.gmaking.character.vo.CharacterVO;

@RestController
@RequestMapping("/api/pve")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class PveBattleController {

    private final PveBattleService pveBattleService;
    private final CharacterService characterService;

    // 맵 목록 조회
    @GetMapping("/maps")
    public ResponseEntity<List<MapVO>> getMaps() {
        List<MapVO> maps = pveBattleService.getMaps();
        return ResponseEntity.ok(maps);
    }

    // 몬스터 조우
    @GetMapping("/encounter")
    public ResponseEntity<MonsterVO> encounterMonster(@RequestParam Integer mapId) {
        MonsterVO monster = pveBattleService.encounterMonster(mapId);
        return ResponseEntity.ok(monster);
    }
    // 유저 캐릭터 가져오기
    @GetMapping("/characters")
    public ResponseEntity<List<CharacterVO>> getUserCharacters(@RequestParam String userId) {
        List<CharacterVO> chars = characterService.getCharactersByUser(userId);
        return ResponseEntity.ok(chars);
    }

    // 전투 시작
    @PostMapping("/battle/start")
    public ResponseEntity<BattleLogVO> startBattle(
            @RequestParam Integer characterId,
            @RequestParam Integer mapId,
            @RequestParam String userId) {

        MonsterVO monster = pveBattleService.encounterMonster(mapId);
        BattleLogVO result = pveBattleService.startBattle(characterId, monster, userId);
        return ResponseEntity.ok(result);
    }
}
