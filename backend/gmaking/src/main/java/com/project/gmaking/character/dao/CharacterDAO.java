package com.project.gmaking.character.dao;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;
import com.project.gmaking.character.vo.CharacterVO;

@Mapper
public interface CharacterDAO {
    List<CharacterVO> selectCharactersByUser(@Param("userId") String userId);
    void incrementStageClear(@Param("characterId") Integer characterId);
}

