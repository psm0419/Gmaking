package com.project.gmaking.pve.controller;

import com.project.gmaking.character.service.CharacterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import org.springframework.web.bind.annotation.PathVariable;

import com.project.gmaking.pve.service.PveBattleService;
import com.project.gmaking.pve.vo.MonsterVO;
import com.project.gmaking.pve.vo.BattleLogVO;
import com.project.gmaking.map.vo.MapVO;
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

    // 프론트엔드에서 axios.get(`/api/pve/maps/${mapId}/image`)로 호출합니다.
    @GetMapping("/maps/{mapId}/image")
    public ResponseEntity<Map<String, String>> getMapImageUrl(@PathVariable Integer mapId) {
        String relativeUrl = pveBattleService.getMapImageUrl(mapId); // 예: /images/map/sea.jpg

        // ⭐ 이 부분을 수정합니다! 서버 주소를 붙여 완전한 URL로 만듭니다.
        String baseUrl = "http://localhost:8080"; // 실제 서버 포트로 변경해야 합니다.
        String absoluteUrl = baseUrl + relativeUrl;

        Map<String, String> response = new HashMap<>();
        response.put("mapImageUrl", absoluteUrl); // 예: http://localhost:8080/images/map/sea.jpg

        return ResponseEntity.ok(response);
    }

    // 몬스터 조우
    @GetMapping("/encounter")
    public ResponseEntity<MonsterVO> encounterMonster(@RequestParam Integer mapId) {
        MonsterVO monster = pveBattleService.encounterMonster(mapId);
        return ResponseEntity.ok(monster);
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
