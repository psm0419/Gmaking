package com.project.gmaking.certification.dao;

import com.project.gmaking.certification.vo.CharacterCertificateVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface CharacterCertificateDao {
    CharacterCertificateVO findCertificateByCharacterId(@Param("characterId") Integer characterId);
}
