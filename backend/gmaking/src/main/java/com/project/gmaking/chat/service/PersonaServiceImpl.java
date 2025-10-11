package com.project.gmaking.chat.service;

import com.project.gmaking.character.dao.CharacterDAO;
import com.project.gmaking.character.vo.CharacterPersonalityVO;
import com.project.gmaking.character.vo.CharacterVO;
import com.project.gmaking.chat.dao.PersonaDAO;
import com.project.gmaking.chat.vo.PersonaVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PersonaServiceImpl implements PersonaService {
    private final PersonaDAO personaDAO;
    private final CharacterDAO characterDAO;

    @Override
    @Transactional
    public PersonaVO ensurePersona(Integer characterId, String userId) {
        // 이미 존재하면 그대로 리턴
        PersonaVO existing = personaDAO.selectPersonaByCharacterId(characterId);
        if (existing != null) return existing;

        // 캐릭터 정보 조회
        CharacterVO character = characterDAO.selectCharacterById(characterId);
        if (character == null) {
            throw new IllegalArgumentException("해당 캐릭터가 존재하지 않습니다.");
        }

        // 성격 정보 조회
        CharacterPersonalityVO personality = null;
        if (character.getCharacterPersonalityId() != null) {
            personality = characterDAO.selectPersonalityById(character.getCharacterPersonalityId());
        }

        String personalityText = (personality != null)
                ? personality.getPersonalityDescription()
                : "기본적인 성격의 캐릭터.";
        String background = (character.getBackgroundInfo() != null)
                ? character.getBackgroundInfo()
                : "이 캐릭터는 특별한 배경이 없습니다.";

        String prompt = String.format(
                """
                        너는 '%s'라는 이름의 캐릭터야.
                        네 성격은 "%s"이고, 배경은 "%s"이야.
                        유저와 자연스럽고 따뜻하게 대화해.
                        너무 기계적이거나 반복적인 말투는 피해.
                        """,
                character.getCharacterName(),
                personalityText,
                background
        );

        // db에 저장
        personaDAO.insertPersona(characterId, prompt, userId);

        // 다시 조회해서 반환
        return personaDAO.selectPersonaByCharacterId(characterId);
    }

}
