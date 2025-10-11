package com.project.gmaking.chat.service;

import com.project.gmaking.chat.vo.PersonaVO;

public interface PersonaService {
    PersonaVO ensurePersona(Integer characterId, String userId);
}
