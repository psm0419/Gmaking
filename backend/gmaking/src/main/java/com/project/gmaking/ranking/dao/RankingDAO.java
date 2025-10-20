package com.project.gmaking.ranking.dao;

import com.project.gmaking.ranking.vo.CharacterRankingVO;
import com.project.gmaking.ranking.vo.PveRankingVO;
import com.project.gmaking.ranking.vo.PvpRankingVO;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;
import java.util.Map;

@Mapper
public interface RankingDAO {
    List<PvpRankingVO> selectPvpRanking();
    List<PveRankingVO> selectPveRanking();
    List<CharacterRankingVO> selectCharacterRanking();
}
