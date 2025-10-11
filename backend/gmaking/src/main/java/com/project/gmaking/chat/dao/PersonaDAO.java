package com.project.gmaking.chat.dao;

import com.project.gmaking.chat.service.PersonaService;
import com.project.gmaking.chat.vo.PersonaVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.springframework.security.core.parameters.P;

@Mapper
public interface PersonaDAO {
    PersonaVO selectPersonaByCharacterId(@Param("characterId") Integer characterId);

    int insertPersona(@Param("characterId") Integer characterId,
                      @Param("instructionPrompt") String instructionPrompt,
                      @Param("actor") String actor);
}
