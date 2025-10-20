package com.project.gmaking.ranking.controller;

import com.project.gmaking.ranking.service.RankingService;
import com.project.gmaking.ranking.vo.CharacterRankingVO;
import com.project.gmaking.ranking.vo.PveRankingVO;
import com.project.gmaking.ranking.vo.PvpRankingVO;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ranking")
@RequiredArgsConstructor
public class RankingController {

    private final RankingService rankingService;

    @GetMapping("/pvp")
    public List<PvpRankingVO> getPvpRanking() {
        return rankingService.getPvpRanking();
    }

    @GetMapping("/pve")
    public List<PveRankingVO> getPveRanking() {
        return rankingService.getPveRanking();
    }

    @GetMapping("/character")
    public List<CharacterRankingVO> getCharacterRanking() {
        return rankingService.getCharacterRanking();
    }
}
