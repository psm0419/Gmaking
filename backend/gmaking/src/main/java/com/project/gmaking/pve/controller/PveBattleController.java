package com.project.gmaking.pve.controller;

import com.project.gmaking.character.service.CharacterService;
import jakarta.servlet.AsyncContext;
import jakarta.servlet.ServletOutputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.concurrent.CompletableFuture;

import org.springframework.web.bind.annotation.PathVariable;

import com.project.gmaking.pve.service.PveBattleService;
import com.project.gmaking.pve.vo.MonsterVO;
import com.project.gmaking.pve.vo.BattleLogVO;
import com.project.gmaking.map.vo.MapVO;
import com.project.gmaking.character.vo.CharacterVO;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Slf4j
@RestController
@RequestMapping("/api/pve")
@RequiredArgsConstructor
@CrossOrigin(
        origins = "http://localhost:3000",
        allowCredentials = "true",
        exposedHeaders = {"Content-Type", "Cache-Control", "X-Accel-Buffering"}
)
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

        // (수정) 맵 정보 전체를 가져옵니다.
        // mapVO 클래스에 getMapImageUrl()과 getMapName()이 있다고 가정합니다.
        MapVO map = pveBattleService.getMapDataById(mapId); // 새로 추가한 Service 메서드 사용

        if (map == null) {
            // 맵 정보가 없을 경우 404 응답
            return ResponseEntity.notFound().build();
        }

        String relativeUrl = map.getMapImageUrl();
        String mapName = map.getMapName(); // MapVO에서 맵 이름을 가져옴!

        String baseUrl = "http://localhost:8080"; // 실제 서버 포트로 변경해야 합니다.
        String absoluteUrl = baseUrl + relativeUrl;

        Map<String, String> response = new HashMap<>();
        response.put("mapImageUrl", absoluteUrl);
        response.put("mapName", mapName); // 맵 이름 추가

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

//    @GetMapping(value = "/battle/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
//    public void streamBattle(
//            @RequestParam Integer characterId,
//            @RequestParam Integer mapId,
//            @RequestParam String userId,
//            HttpServletRequest request,
//            HttpServletResponse response) throws IOException {
//
//        // AsyncContext 시작
//        final AsyncContext asyncContext = request.startAsync();
//        asyncContext.setTimeout(300_000); // 5분
//
//        response.setContentType("text/event-stream");
//        response.setCharacterEncoding("UTF-8");
//        response.setHeader("Cache-Control", "no-cache");
//        response.setHeader("Connection", "keep-alive");
//        response.setHeader("X-Accel-Buffering", "no");
//
//        // 비동기로 처리
//        CompletableFuture.runAsync(() -> {
//            try {
//                ServletOutputStream out = response.getOutputStream();
//                pveBattleService.startBattleStreamWithOutputStream(
//                        characterId, mapId, userId, out
//                );
//                asyncContext.complete();
//            } catch (Exception e) {
//                log.error("전투 스트리밍 실패", e);
//                asyncContext.complete();
//            }
//        });
//    }
}
