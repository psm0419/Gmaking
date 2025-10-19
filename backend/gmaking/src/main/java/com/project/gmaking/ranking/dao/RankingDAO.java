package com.project.gmaking.ranking.dao;

import com.project.gmaking.ranking.vo.CharacterRankingVO;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;
import java.util.Map;

@Mapper
public interface RankingDAO {
    List<Map<String, Object>> selectPvpRanking();
    List<Map<String, Object>> selectPveRanking();
    List<CharacterRankingVO> selectCharacterRanking();
}
