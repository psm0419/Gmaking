package com.project.gmaking.login.controller;

import com.project.gmaking.login.service.LoginService;
import com.project.gmaking.login.vo.LoginRequestVO;
import com.project.gmaking.login.vo.LoginVO;
import com.project.gmaking.login.vo.RegisterRequestVO;
import com.project.gmaking.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class LoginController {

    private final LoginService loginService;
    private final JwtTokenProvider tokenProvider;

    /**
     * 사용자 로그인 요청 처리
     * @param requestVO 사용자 ID와 비밀번호를 담은 객체
     * @return 로그인 성공/실패 응답
     */
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequestVO requestVO) {

        LoginVO authenticatedUser = loginService.authenticate(requestVO);

        Map<String, Object> response = new HashMap<>();

        if (authenticatedUser == null) {
            response.put("success", false);
            response.put("message", "아이디 또는 비밀번호를 다시 확인해주세요.");

            return ResponseEntity.status(401).body(response);
        }

        // jwt 토큰 생성
        String jwt = tokenProvider.createToken(
                authenticatedUser.getUserId(),
                authenticatedUser.getRole()
        );

        // 로그인 성공
        response.put("success", true);
        response.put("message", authenticatedUser.getUserName() + "님, 환영합니다.");
        response.put("token", jwt);

        // 로그인 성공 시 비밀번호만 null 처리해서 반환
        authenticatedUser.setUserPassword(null);
        response.put("userInfo", authenticatedUser);

        return ResponseEntity.ok(response);
    }

    /**
     * ID, 닉네임, 이메일 중복 체크
     */
    @GetMapping("/register/duplicate-check")
    public ResponseEntity<Map<String, Object>> checkDuplicate(
            @RequestParam("type") String type,
            @RequestParam("value") String value) {

        boolean isDuplicate = loginService.isDuplicate(type, value);

        Map<String, Object> response = new HashMap<>();
        response.put("isDuplicate", isDuplicate);

        if (isDuplicate) {
            response.put("message", type + "가 이미 사용 중입니다.");
        } else {
            response.put("message", type + "를 사용할 수 있습니다.");
        }

        return ResponseEntity.ok(response);
    }

    /**
     * 사용자 회원가입 요청 처리
     */
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@Valid @RequestBody RegisterRequestVO requestVO) {
        Map<String, Object> response = new HashMap<>();

        // 비밀번호 확인 검증
        if (!requestVO.getUserPassword().equals(requestVO.getConfirmPassword())) {
            response.put("success", false);
            response.put("message", "비밀번호와 비밀번호 확인이 일치하지 않습니다.");

            return ResponseEntity.badRequest().body(response);
        }

        try {
            // 회원가입 서비스 호출
            LoginVO newUser = loginService.register(requestVO);

            response.put("success", true);
            response.put("message", newUser.getUserName() + "님의 회원가입이 완료되었습니다. 이메일 인증을 완료해주세요.");

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            // 중복 등의 예외 처리 (ServiceImpl에서의 예외)
            response.put("success", false);
            response.put("message", e.getMessage());

            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            response.put("success", false);
            // response.put("message", "회원가입 중 예상치 못한 오류가 발생했습니다.");
            response.put("message", "예상치 못한 오류: " + e.getMessage());

            return ResponseEntity.internalServerError().body(response);
        }
    }

}