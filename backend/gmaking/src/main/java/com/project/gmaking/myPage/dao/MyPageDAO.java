package com.project.gmaking.myPage.dao;

import com.project.gmaking.myPage.vo.CharacterCardVO;
import com.project.gmaking.myPage.vo.MyPageProfileVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface MyPageDAO {
    // 마이 페이지 상단 프로필 조회
    MyPageProfileVO selectProfile(@Param("userId") String userId);

    // 캐릭터 카드 목록
    List<CharacterCardVO> selectCharacters(
            @Param("userId") String userId,
            @Param("limit") int limit,
            @Param("offset") int offset
    );
    // 내 캐릭터 총 개수
    Integer countCharacters(@Param("userId") String userId);
}
