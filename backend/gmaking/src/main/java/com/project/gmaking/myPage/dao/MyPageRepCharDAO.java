package com.project.gmaking.myPage.dao;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface MyPageRepCharDAO {

    // 현재 대표 캐릭터 아이디
    Integer selectRepresentativeCharacterId(@Param("userId") String userId);

    // 해당 캐릭터가 사용자 소유인지 검사
    int existsMyCharacter(@Param("userId") String userId,
                          @Param("characterid") Integer characterId);

    // 대표 캐릭터 설정
    int updateRepresentativeCharacter(@Param("userId") String userId,
                                      @Param("characterId") Integer characterId);

    // 대표 캐릭터 해제
    int clearRepresentativeCharacter(@Param("userId") String userId);
}
