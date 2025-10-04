package com.project.gmaking.oauth2.handler;

import com.project.gmaking.oauth2.vo.OAuth2Attributes;
import com.project.gmaking.security.JwtTokenProvider;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;
    private final String FRONTEND_REDIRECT_URI = "http://localhost:3000/oauth/callback";

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {

        // Spring Security Context에서 OAuth2Attributes(Custom UserDetails) 객체 획득
        OAuth2Attributes oauth2Attributes = (OAuth2Attributes) authentication.getPrincipal();

        // JWT 토큰 생성에 필요한 사용자 정보 추출
        String userId = oauth2Attributes.getLoginVO().getUserId();
        String role = oauth2Attributes.getLoginVO().getRole();

        // JWT 토큰 생성
        String jwtToken = jwtTokenProvider.createToken(userId, role);
        log.info(">>> [OAuth2 Success] JWT Token issued for user: {}", userId);

        // JWT와 사용자 정보를 URL 쿼리 파라미터에 담아 프론트엔드로 리다이렉션
        // 프론트엔드에서 JWT를 받아서 로컬 스토리지에 저장하고 메인 페이지로 이동시키는 역할을 합니다.
        String targetUrl = buildTargetUrl(jwtToken, oauth2Attributes);

        // 리다이렉트
        getRedirectStrategy().sendRedirect(request, response, targetUrl);

    }

    /**
     * JWT 토큰과 사용자 정보를 포함하는 리다이렉션 URL 생성
     */
    private String buildTargetUrl(String jwtToken, OAuth2Attributes oauth2Attributes) {
        String userId = URLEncoder.encode(oauth2Attributes.getLoginVO().getUserId(), StandardCharsets.UTF_8);
        String nickname = URLEncoder.encode(oauth2Attributes.getLoginVO().getUserNickname(), StandardCharsets.UTF_8);
        String role = URLEncoder.encode(oauth2Attributes.getLoginVO().getRole(), StandardCharsets.UTF_8);
        String hasCharacter = "false";

        return String.format("%s?token=%s&userId=%s&nickname=%s&role=%s&hasCharacter=%s",
                FRONTEND_REDIRECT_URI,
                jwtToken,
                userId,
                nickname,
                role,
                hasCharacter
        );
    }

}