package com.project.gmaking.login.controller;

import com.project.gmaking.login.service.LoginService;
import com.project.gmaking.login.vo.WithdrawRequestVO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final LoginService loginService;

    /**
     * 회원 탈퇴 요청 처리
     * - JWT로 인증된 사용자인지 확인
     * - 요청된 ID와 인증된 ID가 일치하는지 확인 (보안 강화)
     * - 비밀번호를 재확인하여 최종 삭제
     * @param requestVO 사용자 ID와 현재 비밀번호
     * @param authentication JWT를 통해 인증된 사용자 정보 (SecurityContextHolder에서 자동 주입)
     * @return 성공/실패 응답
     */
    @DeleteMapping("/withdraw")
    public ResponseEntity<Map<String, Object>> withdraw(
            @Valid @RequestBody WithdrawRequestVO requestVO,
            Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        String authenticatedUserId = authentication.getName();

        // 보안 검증: JWT의 사용자 ID와 요청 본문의 사용자 ID가 일치하는지 확인
        if (!authenticatedUserId.equals(requestVO.getUserId())) {
            response.put("success", false);
            response.put("message", "인증 정보가 요청된 사용자와 일치하지 않습니다.");
            return ResponseEntity.status(403).body(response); // 403 Forbidden
        }

        try {
            // 서비스 계층에서 비밀번호 확인 및 삭제 처리
            loginService.withdrawUser(requestVO.getUserId(), requestVO.getUserPassword());

            response.put("success", true);
            response.put("message", requestVO.getUserId() + "님의 계정 탈퇴가 완료되었습니다.");

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            // 비밀번호 불일치, 사용자 없음 등의 오류 처리
            response.put("success", false);
            response.put("message", e.getMessage());

            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "회원 탈퇴 처리 중 예상치 못한 오류가 발생했습니다.");
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * 소셜 회원 탈퇴 요청 처리 (비밀번호 검증 불필요)
     * - JWT로 인증된 사용자 ID만으로 탈퇴를 진행합니다.
     * @param authentication JWT를 통해 인증된 사용자 정보
     * @return 성공/실패 응답
     */
    @DeleteMapping("/withdraw/social")
    public ResponseEntity<Map<String, Object>> withdrawSocial(Authentication authentication) {
        Map<String, Object> response = new HashMap<>();

        // JWT에서 인증된 사용자 ID를 직접 사용
        String authenticatedUserId = authentication.getName();

        try {
            // 서비스 계층에서 소셜 사용자 삭제 처리
            loginService.withdrawSocialUser(authenticatedUserId);

            response.put("success", true);
            response.put("message", authenticatedUserId + "님의 계정 탈퇴가 완료되었습니다. (소셜 계정)");

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            // 사용자 없음 등의 오류 처리
            response.put("success", false);
            response.put("message", e.getMessage());

            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "회원 탈퇴 처리 중 예상치 못한 오류가 발생했습니다.");
            return ResponseEntity.status(500).body(response);
        }
    }

}