package com.project.gmaking.login.controller;

import com.project.gmaking.email.service.EmailVerificationService;
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
    private final EmailVerificationService verificationService;

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
                authenticatedUser.getRole(),
                authenticatedUser.getUserNickname(),
                authenticatedUser.isHasCharacter(),
                authenticatedUser.getCharacterImageUrl(),
                authenticatedUser.getIncubatorCount(),
                authenticatedUser.isAdFree(),
                authenticatedUser.getCharacterCount()
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

    /**
     * 아이디 찾기: 이름과 이메일로 사용자 ID를 찾고, 인증 코드를 발송
     * @param request JSON 객체 { userName, userEmail }
     * @return 인증 코드 발송 성공 응답 (임시 userId 포함)
     */
    @PostMapping("/find-id/send-code")
    public ResponseEntity<Map<String, Object>> findIdSendCode(@RequestBody Map<String, String> request) {
        String userName = request.get("userName");
        String userEmail = request.get("userEmail");

        Map<String, Object> response = new HashMap<>();

        if (userName == null || userEmail == null) {
            response.put("success", false);
            response.put("message", "이름과 이메일을 모두 입력해주세요.");

            return ResponseEntity.badRequest().body(response);
        }

        try {
            String userId = loginService.findIdAndSendVerification(userName, userEmail);

            response.put("success", true);
            response.put("message", "인증 코드가 이메일로 발송되었습니다. 3분 이내에 코드를 입력해주세요.");
            response.put("userId", userId);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            response.put("success", false);
            response.put("message", e.getMessage());

            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "아이디 찾기 중 오류가 발생했습니다.");

            return ResponseEntity.internalServerError().body(response);
        }

    }

    /**
     * 아이디 찾기: 인증 코드를 검증하고 최종적으로 아이디를 반환
     * @param request JSON 객체 { userId, email, code }
     * @return 아이디 찾기 성공 응답 (마스킹된 userId 포함)
     */
    @PostMapping("/find-id/verify-code")
    public ResponseEntity<Map<String, Object>> findIdVerifyCode(@RequestBody Map<String, String> request) {
        String userId = request.get("userId");
        String email = request.get("email");
        String code = request.get("code");

        Map<String, Object> response = new HashMap<>();

        if (userId == null || email == null || code == null) {
            response.put("success", false);
            response.put("message", "필수 입력값(userId, email, code)이 누락되었습니다.");
            return ResponseEntity.badRequest().body(response);
        }

        try {
            // 이메일 인증 코드를 검증 (EmailVerificationService의 로직 호출)
            boolean isVerified = verificationService.verifyCode(userId, email, code);

            // 인증이 완료된 후, 아이디를 반환하고 인증 기록 삭제
            if (isVerified) {
                String maskedUserId = loginService.verifyCodeAndGetUserId(userId);

                response.put("success", true);
                response.put("message", "아이디 찾기가 완료되었습니다.");
                response.put("userId", maskedUserId);

                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", "인증 코드가 일치하지 않거나 만료되었습니다.");

                return ResponseEntity.badRequest().body(response);
            }
        } catch (IllegalArgumentException e) {
            response.put("success", false);
            response.put("message", e.getMessage());

            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "인증 처리 중 예상치 못한 오류가 발생했습니다.");

            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * 1. 비밀번호 찾기: ID와 이메일로 사용자 확인 후, 인증 코드 발송
     * @param request JSON 객체 { userId, userEmail }
     * @return 인증 코드 발송 성공 응답
     */
    @PostMapping("/find-password/send-code")
    public ResponseEntity<Map<String, Object>> findPasswordSendCode(@RequestBody Map<String, String> request) {
        String userId = request.get("userId");
        String userEmail = request.get("userEmail");

        Map<String, Object> response = new HashMap<>();

        if (userId == null || userEmail == null) {
            response.put("success", false);
            response.put("message", "아이디와 이메일을 모두 입력해주세요.");

            return ResponseEntity.badRequest().body(response);
        }

        try {
            loginService.findPasswordAndSendVerification(userId, userEmail);

            response.put("success", true);
            response.put("message", "인증 코드가 이메일로 발송되었습니다. 3분 이내에 인증을 완료해주세요.");
            response.put("userId", userId);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            response.put("success", false);
            response.put("message", e.getMessage());

            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "비밀번호 찾기 중 오류가 발생했습니다.");

            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * 비밀번호 찾기: 인증 코드 검증 요청 (기존 /api/email/verify-code 재활용)
     * - 이메일 인증 컨트롤러를 그대로 사용하면 됩니다.
     * - 비밀번호 변경: 인증이 완료된 후, 새 비밀번호로 업데이트
     * @param request JSON 객체 { userId, userEmail, code, newPassword, confirmPassword }
     * @return 비밀번호 변경 성공/실패 응답
     */
    @PostMapping("/find-password/change")
    public ResponseEntity<Map<String, Object>> changePassword(@RequestBody Map<String, String> request) {
        String userId = request.get("userId");
        String userEmail = request.get("userEmail");
        String newPassword = request.get("newPassword");
        String confirmPassword = request.get("confirmPassword");

        Map<String, Object> response = new HashMap<>();

        if (userId == null || userEmail == null || newPassword == null || confirmPassword == null) {
            response.put("success", false);
            response.put("message", "필수 입력값(아이디, 이메일, 새 비밀번호)이 누락되었습니다.");

            return ResponseEntity.badRequest().body(response);
        }

        // 새 비밀번호와 확인 비밀번호 일치 검사
        if (!newPassword.equals(confirmPassword)) {
            response.put("success", false);
            response.put("message", "새 비밀번호와 확인 비밀번호가 일치하지 않습니다.");

            return ResponseEntity.badRequest().body(response);
        }

        try {
            // 서비스 계층에서 인증 상태 확인 및 비밀번호 변경 처리
            loginService.changePassword(userId, userEmail, newPassword);

            response.put("success", true);
            response.put("message", userId + "님의 비밀번호가 성공적으로 변경되었습니다. 다시 로그인해주세요.");

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            // 인증 미완료, 비밀번호 규칙 불일치 등의 오류 처리
            response.put("success", false);
            response.put("message", e.getMessage());

            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "비밀번호 변경 중 예상치 못한 오류가 발생했습니다.");

            return ResponseEntity.internalServerError().body(response);
        }
    }

}