package com.project.gmaking.email.dao;

import com.project.gmaking.email.vo.EmailVerificationVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface EmailVerificationDAO {

    /**
     * 인증 코드를 TB_USER_EMAIL_VERIFY에 저장
     */
    int saveVerificationCode(EmailVerificationVO vo);

    /**
     * 특정 사용자/이메일의 최신 인증 정보 조회
     */
    EmailVerificationVO getVerificationInfo(@Param("userId") String userId, @Param("email") String email);

    /**
     * 인증 성공 후, TB_USER_EMAIL_VERIFY 테이블의 IS_VERIFIED를 'Y'로 업데이트
     */
    int updateVerificationStatus(@Param("userId") String userId, @Param("isVerified") String isVerified);

    /**
     * TB_USER 테이블의 이메일 인증 상태(is_verified) 컬럼을 'Y'로 업데이트
     */
    int updateIsEmailVerifiedInUser(@Param("userId") String userId, @Param("isVerified") String isVerified);

    /**
     * 특정 사용자의 모든 인증 기록 삭제 (회원 탈퇴 시 사용)
     * @param userId 삭제할 사용자 ID
     * @return 삭제된 레코드 수
     */
    int deleteVerificationInfoByUserId(String userId);

}