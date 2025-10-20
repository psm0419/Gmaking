package com.project.gmaking.ranking.service;

import com.project.gmaking.ranking.vo.CharacterRankingVO;
import com.project.gmaking.ranking.vo.PveRankingVO;
import com.project.gmaking.ranking.vo.PvpRankingVO;

import java.util.List;
import java.util.Map;

public interface RankingService {
    List<PvpRankingVO> getPvpRanking();
    List<PveRankingVO> getPveRanking();
    List<CharacterRankingVO> getCharacterRanking();
}
