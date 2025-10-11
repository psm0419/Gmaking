package com.project.gmaking.character.dao;

import com.project.gmaking.character.vo.CharacterPersonalityVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import com.project.gmaking.character.vo.CharacterVO;

@Mapper
public interface CharacterDAO {
    List<CharacterVO> selectCharactersByUser(@Param("userId") String userId);
    void incrementStageClear(@Param("characterId") Integer characterId);
    
    // 캐릭터 하나 조회
    CharacterVO selectCharacterById(@Param("characterId") Integer characterId);
    // 캐릭터 성격 조회
    CharacterPersonalityVO selectPersonalityById(
            @Param("personalityId") Integer characterPersonalityId);

    // 채팅 목록
    List<Map<String, Object>> selectCharactersForChat(@Param("userId") String userId);

}

