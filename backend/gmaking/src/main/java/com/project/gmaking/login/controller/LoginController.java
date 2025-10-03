package com.project.gmaking.login.controller;

import com.project.gmaking.login.service.LoginService;
import com.project.gmaking.login.vo.LoginRequestVO;
import com.project.gmaking.login.vo.LoginVO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/login")
@RequiredArgsConstructor
public class LoginController {

    private final LoginService loginService;

    /**
     * 사용자 로그인 요청 처리
     * @param requestVO 사용자 ID와 비밀번호를 담은 객체
     * @return 로그인 성공/실패 응답
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequestVO requestVO) {

        LoginVO authenticatedUser = loginService.authenticate(requestVO);

        Map<String, Object> response = new HashMap<>();

        if (authenticatedUser == null) {
            response.put("success", false);
            response.put("message", "아이디 또는 비밀번호를 다시 확인해주세요.");

            return ResponseEntity.status(401).body(response);
        }

        // 로그인 성공 (실제 서비스에서는 JWT 토큰 등을 여기에 추가해야 합니다.)
        response.put("success", true);
        response.put("message", authenticatedUser.getUserName() + "님, 환영합니다.");
        response.put("userInfo", authenticatedUser);

        return ResponseEntity.ok(response);
    }
}