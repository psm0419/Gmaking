package com.project.gmaking.login.dao;

import com.project.gmaking.login.vo.LoginVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface LoginDAO {

    /**
     * 사용자 ID를 기반으로 TB_USER에서 사용자 정보를 조회
     * @param userId 조회할 사용자 ID (TB_USER.USER_ID)
     * @return LoginVO 객체 (사용자 전체 정보)
     */
    LoginVO selectUserById(@Param("userId") String userId);
}