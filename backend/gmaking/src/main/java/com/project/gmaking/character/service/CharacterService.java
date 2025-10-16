package com.project.gmaking.character.service;

import com.project.gmaking.character.dao.CharacterStatDAO;
import com.project.gmaking.character.vo.CharacterStatVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;

import com.project.gmaking.character.dao.CharacterDAO;
import com.project.gmaking.character.vo.CharacterVO;

@Service
@RequiredArgsConstructor
public class CharacterService {

    private final CharacterDAO characterDAO;
    private final CharacterStatDAO characterStatDAO;

    public List<CharacterVO> getCharactersByUser(String userId) {
        return characterDAO.selectCharactersByUser(userId);
    }

    public List<Map<String, Object>> getCharactersForChat(String userId) {
        return characterDAO.selectCharactersForChat(userId);
    }

    // 단건 스탯 조회
    public CharacterStatVO getCharacterStat(Integer characterId) {
        return characterStatDAO.getCharacterStat(characterId);
    }

}

