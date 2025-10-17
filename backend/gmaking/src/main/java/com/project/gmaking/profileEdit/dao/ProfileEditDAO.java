package com.project.gmaking.profileEdit.dao;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.Map;

@Mapper
public interface ProfileEditDAO {

    // 닉네임/이미지 URL 조회
    Map<String, Object> selectProfile(@Param("userId") String userId);

    // 닉네임 변경
    int updateNickname(@Param("userId") String userId, @Param("nickname") String nickname);

    // 비밀번호 해시 조회/변경
    String selectPasswordHash(@Param("userId") String userId);

    int updatePasswordHash(@Param("userId") String userId,
                           @Param("passwordHash") String passwordHash);

    // 이미지 저장
    int insertImage(Map<String, Object> p);

    //유저 프로필 이미지 교체
    int updateUserImage(@Param("userId") String userId, @Param("imageId") Integer imageId);
}
