package com.project.gmaking.ranking.service;

import com.project.gmaking.ranking.vo.CharacterRankingVO;

import java.util.List;
import java.util.Map;

public interface RankingService {
    List<Map<String, Object>> getPvpRanking();
    List<Map<String, Object>> getPveRanking();
    List<CharacterRankingVO> getCharacterRanking();
}
