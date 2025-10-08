package com.project.gmaking.pve.dao;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.project.gmaking.pve.vo.MonsterVO;

@Mapper
public interface MonsterDAO {
    MonsterVO getRandomMonsterByType(String type);
    // 타입(NORMAL, BOSS)에 따라 랜덤 몬스터 1마리 조회
    MonsterVO selectRandomMonster(@Param("monsterType") String monsterType);
}
