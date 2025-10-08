package com.project.gmaking.pve.dao;

import org.apache.ibatis.annotations.Mapper;
import com.project.gmaking.pve.vo.MonsterVO;

@Mapper
public interface MonsterDAO {
    MonsterVO getRandomMonsterByType(String type);
}
