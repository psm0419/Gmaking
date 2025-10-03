package com.project.gmaking.login.service;

import com.project.gmaking.login.dao.LoginDAO;
import com.project.gmaking.login.service.LoginService;
import com.project.gmaking.login.vo.LoginRequestVO;
import com.project.gmaking.login.vo.LoginVO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LoginServiceImpl implements LoginService {

    private final LoginDAO loginDAO;
    private final PasswordEncoder passwordEncoder; // SecurityConfig에서 주입됨

    @Override
    public LoginVO authenticate(LoginRequestVO requestVO) {

        // DB에서 사용자 ID로 전체 정보 조회
        LoginVO user = loginDAO.selectUserById(requestVO.getUserId());

        // 사용자 존재 여부 확인
        if (user == null) {
            return null; // 사용자 ID 없음
        }

        // 비밀번호 일치 여부 확인 (암호화된 비밀번호 비교)
        // 입력 비밀번호(raw)와 DB에 저장된 암호화된 비밀번호(encoded)를 비교
        if (passwordEncoder.matches(requestVO.getUserPassword(), user.getUserPassword())) {
            // 로그인 성공
            // 보안을 위해 비밀번호 필드는 제거하고 반환
            user.setUserPassword(null);

            return user;
        } else {
            // 비밀번호 불일치
            return null;
        }
    }
}