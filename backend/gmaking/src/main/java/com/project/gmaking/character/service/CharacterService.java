package com.project.gmaking.character.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import com.project.gmaking.character.dao.CharacterDAO;
import com.project.gmaking.character.vo.CharacterVO;

@Service
@RequiredArgsConstructor
public class CharacterService {

    private final CharacterDAO characterDAO;

    public List<CharacterVO> getCharactersByUser(String userId) {
        return characterDAO.selectCharactersByUser(userId);
    }
}

