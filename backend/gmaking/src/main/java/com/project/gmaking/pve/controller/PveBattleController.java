package com.project.gmaking.pve.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.project.gmaking.pve.service.PveBattleService;
import com.project.gmaking.pve.vo.MonsterVO;

@RestController
@RequestMapping("/api/pve")
@RequiredArgsConstructor
public class PveBattleController {

    private final PveBattleService pveBattleService;

    @GetMapping("/encounter")
    public ResponseEntity<MonsterVO> encounterMonster(@RequestParam Integer mapId) {
        MonsterVO monster = pveBattleService.encounterMonster(mapId);
        return ResponseEntity.ok(monster);
    }
}
