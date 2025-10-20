package com.project.gmaking.ranking.service;

import com.project.gmaking.ranking.dao.RankingDAO;
import com.project.gmaking.ranking.vo.CharacterRankingVO;
import com.project.gmaking.ranking.vo.PveRankingVO;
import com.project.gmaking.ranking.vo.PvpRankingVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RankingServiceImpl implements RankingService {

    private final RankingDAO rankingDAO;

    @Override
    public List<PvpRankingVO> getPvpRanking() {
        return rankingDAO.selectPvpRanking();
    }

    @Override
    public List<PveRankingVO> getPveRanking() {
        return rankingDAO.selectPveRanking();
    }

    @Override
    public List<CharacterRankingVO> getCharacterRanking() {
        return rankingDAO.selectCharacterRanking();
    }
}
