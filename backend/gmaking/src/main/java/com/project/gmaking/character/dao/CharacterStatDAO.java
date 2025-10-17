package com.project.gmaking.character.dao;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.project.gmaking.character.vo.CharacterStatVO;

@Mapper
public interface CharacterStatDAO {
    CharacterStatVO getCharacterStat(@Param("characterId") Integer characterId);
    // 스탯 삽입 메서드
    void insertCharacterStat(CharacterStatVO statVO);
}
