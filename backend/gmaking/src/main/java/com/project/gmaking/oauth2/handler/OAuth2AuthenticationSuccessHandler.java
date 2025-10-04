package com.project.gmaking.oauth2.handler;

import com.project.gmaking.login.dao.LoginDAO;
import com.project.gmaking.login.vo.LoginVO;
import com.project.gmaking.oauth2.userinfo.OAuth2UserInfo;
import com.project.gmaking.oauth2.userinfo.OAuth2UserInfoFactory;
import com.project.gmaking.security.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
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
    private final LoginDAO loginDAO;
    private final String FRONTEND_REDIRECT_URI = "http://localhost:3000/oauth/callback";

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException {
        OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();
        OAuth2AuthenticationToken authToken = (OAuth2AuthenticationToken) authentication;

        String registrationId = authToken.getAuthorizedClientRegistrationId();
        OAuth2UserInfo userInfo = OAuth2UserInfoFactory.getOAuth2UserInfo(registrationId, oauthUser.getAttributes());
        String socialId = registrationId + "_" + userInfo.getId();

        LoginVO loginVO = loginDAO.selectUserBySocialId(socialId);
        if (loginVO == null) {
            throw new IllegalStateException("사용자를 찾을 수 없습니다: " + socialId);
        }

        String jwtToken = jwtTokenProvider.createToken(loginVO.getUserId(), loginVO.getRole());
        String targetUrl = buildTargetUrl(jwtToken, loginVO);

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }

    private String buildTargetUrl(String jwtToken, LoginVO loginVO) {
        String userId = URLEncoder.encode(loginVO.getUserId(), StandardCharsets.UTF_8);
        String nickname = URLEncoder.encode(loginVO.getUserNickname(), StandardCharsets.UTF_8);
        String role = URLEncoder.encode(loginVO.getRole(), StandardCharsets.UTF_8);
        String hasCharacter = loginVO.getCharacterId() != null ? "true" : "false";

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
