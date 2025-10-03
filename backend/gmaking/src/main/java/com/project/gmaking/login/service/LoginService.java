package com.project.gmaking.login.service;

import com.project.gmaking.login.vo.LoginRequestVO;
import com.project.gmaking.login.vo.LoginVO;

public interface LoginService {

    /**
     * 로그인 요청을 처리하고 인증에 성공한 사용자 정보를 반환
     * @param requestVO 클라이언트로부터 받은 ID와 비밀번호
     * @return 로그인 성공 시 사용자 정보(LoginVO), 실패 시 null
     */
    LoginVO authenticate(LoginRequestVO requestVO);
}