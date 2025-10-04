package com.project.gmaking.oauth2.handler;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Slf4j
@Component
public class OAuth2AuthenticationFailureHandler implements AuthenticationFailureHandler {

    @Value("${app.oauth2.redirect-uri}")
    private String redirectUri;

    /**
     * OAuth2 인증 실패 시 호출됩니다.
     */
    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response,
                                        AuthenticationException exception) throws IOException, ServletException {

        // 에러 메시지 추출 및 인코딩
        String errorMessage = exception.getMessage();
        if (errorMessage == null || errorMessage.isEmpty()) {
            errorMessage = "소셜 로그인에 실패했습니다. 관리자에게 문의하세요.";
        }

        // 에러 메시지 URL 인코딩
        String encodedErrorMessage = URLEncoder.encode(errorMessage, StandardCharsets.UTF_8);

        log.error(">>>> [OAuth2-Failure] 소셜 로그인 실패: {}", errorMessage);

        // 리다이렉션 URL 생성
        String targetUrl = UriComponentsBuilder.fromUriString(redirectUri)
                .path("/oauth/callback/failure")
                .queryParam("error", encodedErrorMessage)
                .build().toUriString();

        // 클라이언트(브라우저)에게 리다이렉션 명령
        response.sendRedirect(targetUrl);
    }
}