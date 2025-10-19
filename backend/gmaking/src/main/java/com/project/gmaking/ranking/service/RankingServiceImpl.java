package com.project.gmaking.ranking.service;

import com.project.gmaking.ranking.dao.RankingDAO;
import com.project.gmaking.ranking.vo.CharacterRankingVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RankingServiceImpl implements RankingService {

    private final RankingDAO rankingDAO;

    @Override
    public List<Map<String, Object>> getPvpRanking() {
        return rankingDAO.selectPvpRanking();
    }

    @Override
    public List<Map<String, Object>> getPveRanking() {
        return rankingDAO.selectPveRanking();
    }

    @Override
    public List<CharacterRankingVO> getCharacterRanking() {
        return rankingDAO.selectCharacterRanking();
    }
}
