package com.project.gmaking.login.dao;

import com.project.gmaking.login.vo.LoginVO;
import com.project.gmaking.login.vo.RegisterRequestVO;
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

    /**
     * 사용자 정보를 TB_USER 테이블에 저장 (회원가입)
     * @param registerRequestVO 회원가입 요청 정보
     * @return 성공적으로 삽입된 레코드 수 (1 또는 0)
     */
    int insertUser(RegisterRequestVO registerRequestVO);

    /**
     * 중복 확인: ID, 닉네임, 이메일 중 하나라도 중복되는지 확인
     */
    int checkDuplicate(@Param("type") String type, @Param("value") String value);

    /**
     * 사용자 계정 삭제 (회원 탈퇴)
     * @param userId 삭제할 사용자 ID
     * @return 성공적으로 삭제된 레코드 수
     */
    int deleteUser(String userId);

    /**
     * 이름과 이메일로 사용자 ID를 조회 (아이디 찾기)
     * @param userName 사용자 이름
     * @param userEmail 사용자 이메일
     * @return 일치하는 사용자 ID (없으면 null)
     */
    String findUserIdByNameAndEmail(@Param("userName") String userName, @Param("userEmail") String userEmail);
}