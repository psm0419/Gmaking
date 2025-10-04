package com.project.gmaking.persona.dao;

import com.project.gmaking.persona.vo.PersonaVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface PersonaDAO {
    PersonaVO findByCharacterId(@Param("characterId") int characterId);
}
