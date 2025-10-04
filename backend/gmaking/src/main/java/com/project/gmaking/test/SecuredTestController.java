package com.project.gmaking.test;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * JWT 인증 테스트를 위한 컨트롤러입니다.
 * 이 경로는 SecurityConfig에서 인증된 사용자만 접근 가능하도록 보호됩니다.
 */
@RestController
@RequestMapping("/api/secured")
public class SecuredTestController {

    /**
     * 인증된 사용자만 접근 가능한 테스트 API
     * @return 성공 메시지
     */
    @GetMapping("/test")
    public ResponseEntity<String> getSecuredTestMessage() {
        return ResponseEntity.ok("JWT 인증 성공! 보호된 리소스에 접근했습니다.");
    }
}