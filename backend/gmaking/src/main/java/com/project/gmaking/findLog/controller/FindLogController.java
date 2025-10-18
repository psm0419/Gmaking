package com.project.gmaking.findLog.controller;

import com.project.gmaking.findLog.service.FindLogService;
import com.project.gmaking.pve.vo.BattleLogVO;
import com.project.gmaking.pve.vo.TurnLogVO;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/logs")
@RequiredArgsConstructor
public class FindLogController {

    private final FindLogService findLogService;

    // 1. 유저의 배틀 로그 목록 조회
    @GetMapping("/{userId}")
    public List<BattleLogVO> getBattleLogs(@PathVariable String userId) {
        return findLogService.getBattleLogsByUser(userId);
    }

    // 2. 특정 배틀의 턴 로그 조회
    @GetMapping("/turns/{battleId}")
    public List<TurnLogVO> getTurnLogs(@PathVariable Integer battleId) {
        return findLogService.getTurnLogsByBattleId(battleId);
    }
}
