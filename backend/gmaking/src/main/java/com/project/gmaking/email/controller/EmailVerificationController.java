package com.project.gmaking.email.controller;

import com.project.gmaking.email.service.EmailVerificationService;
import com.project.gmaking.login.service.LoginService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/email")
@RequiredArgsConstructor
public class EmailVerificationController {

    private final EmailVerificationService verificationService;
    private final LoginService loginService;

    /**
     * 사용자 입력 인증 코드를 검증하는 API
     * @param request JSON 객체 { userId, email, code }
     * @return 검증 성공/실패 응답
     */
    @PostMapping("/verify-code")
    public ResponseEntity<Map<String, Object>> verifyCode(@RequestBody Map<String, String> request) {
        String userId = request.get("userId");
        String email = request.get("email");
        String code = request.get("code");

        Map<String, Object> response = new HashMap<>();

        if (userId == null || email == null || code == null) {
            response.put("success", false);
            response.put("message", "필수 입력값(userId, email, code)이 누락되었습니다.");
            return ResponseEntity.badRequest().body(response);
        }

        boolean isVerified = verificationService.verifyCode(userId, email, code);

        if (isVerified) {
            // TB_USER 테이블의 인증 상태 업데이트
            loginService.completeEmailVerification(userId);

            response.put("success", true);
            response.put("message", "이메일 인증이 완료되었습니다.");

            return ResponseEntity.ok(response);
        } else {
            response.put("success", false);
            response.put("message", "인증 코드가 일치하지 않거나 만료되었습니다.");

            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * 인증 코드를 재발송하는 API
     * @param request JSON 객체 { userId, email }
     * @return 재발송 성공/실패 응답
     */
    @PostMapping("/resend-code")
    public ResponseEntity<Map<String, Object>> resendCode(@RequestBody Map<String, String> request) {
        String userId = request.get("userId");
        String email = request.get("email");

        Map<String, Object> response = new HashMap<>();

        if (userId == null || email == null) {
            response.put("success", false);
            response.put("message", "필수 입력값(userId, email)이 누락되었습니다.");
            return ResponseEntity.badRequest().body(response);
        }

        try {
            // 기존의 코드 발송/DB 저장 로직 (ON DUPLICATE KEY UPDATE) 재사용
            verificationService.sendCode(userId, email);

            response.put("success", true);
            response.put("message", "새로운 인증 코드가 이메일로 재발송되었습니다. 3분 이내에 인증을 완료해주세요.");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            // 이메일 발송 오류, DB 오류 등 처리
            response.put("success", false);
            response.put("message", "인증 코드 재발송 중 오류가 발생했습니다. 잠시 후 다시 시도하거나 관리자에게 문의하세요.");

            return ResponseEntity.status(500).body(response);
        }
    }

}