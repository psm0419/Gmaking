package com.project.gmaking.login.service;

import com.project.gmaking.login.vo.LoginRequestVO;
import com.project.gmaking.login.vo.LoginVO;
import com.project.gmaking.login.vo.RegisterRequestVO;

public interface LoginService {

    /**
     * 로그인 요청을 처리하고 인증에 성공한 사용자 정보를 반환
     */
    LoginVO authenticate(LoginRequestVO requestVO);

    /**
     * 회원가입 요청을 처리하고 사용자 정보를 DB에 저장
     * @param requestVO 회원가입 요청 정보
     * @return 등록된 사용자 정보
     * @throws IllegalArgumentException 중복 등의 오류 발생 시
     */
    LoginVO register(RegisterRequestVO requestVO);

    /**
     * ID, 닉네임, 이메일 중복 여부 확인
     * @param type 확인할 필드 타입 (userId, userNickname, userEmail)
     * @param value 확인할 값
     * @return 중복이면 true, 아니면 false
     */
    boolean isDuplicate(String type, String value);

    /**
     * 이메일 인증 완료 후 TB_USER의 인증 상태를 'Y'로 업데이트
     */
    void completeEmailVerification(String userId);

}