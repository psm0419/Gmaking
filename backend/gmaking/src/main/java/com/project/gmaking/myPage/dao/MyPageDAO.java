package com.project.gmaking.myPage.dao;

import com.project.gmaking.myPage.vo.CharacterCardVO;
import com.project.gmaking.myPage.vo.MyPageProfileVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface MyPageDAO {
    MyPageProfileVO selectProfile(@Param("userId") String userId);

    List<CharacterCardVO> selectCharacters(
            @Param("userId") String userId,
            @Param("limit") int limit,
            @Param("offset") int offset
    );

    Integer countCharacters(@Param("userId") String userId);
}
