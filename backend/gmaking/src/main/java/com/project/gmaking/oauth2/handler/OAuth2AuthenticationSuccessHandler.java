package com.project.gmaking.oauth2.handler;

import com.project.gmaking.login.dao.LoginDAO;
import com.project.gmaking.login.vo.LoginVO;
import com.project.gmaking.oauth2.vo.OAuth2Attributes;
import com.project.gmaking.security.JwtTokenProvider;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.InternalAuthenticationServiceException;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
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
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {

        // Principal 객체 획득 및 타입 검사
        OAuth2User principal = (OAuth2User) authentication.getPrincipal();
        OAuth2Attributes oauth2Attributes = null;

        if (principal instanceof OAuth2Attributes) {
            oauth2Attributes = (OAuth2Attributes) principal;
            log.info(">>> [OAuth2 Success] Principal is OAuth2Attributes.");

        } else if (principal instanceof OidcUser) {
            // Google DefaultOidcUser로 래핑되어 넘어온 경우
            OidcUser oidcUser = (OidcUser) principal;

            // CustomOAuth2UserService에서 저장한 소셜 ID 패턴과 동일하게 ID 재구성
            // Google의 고유 ID(sub)를 Attributes에서 추출
            String googleUniqueId = oidcUser.getAttribute("sub");
            String registrationId = "google"; // Google 소셜 타입
            String socialId = registrationId + "_" + googleUniqueId;

            log.info(">>> [OAuth2 Success] Principal is OidcUser. SocialId: {}", socialId);

            // DB에서 Social ID를 기준으로 LoginVO 조회
            LoginVO loginVO = loginDAO.selectUserBySocialId(socialId);

            if (loginVO == null) {
                log.error(">>> [OAuth2 ERROR] Cannot find LoginVO for socialId: {}", socialId);
                sendFailureRedirect(request, response, "인증 후 DB에서 사용자 정보를 찾을 수 없습니다.");
                return;
            }

            // JWT 발급에 필요한 OAuth2Attributes 객체 재구성
            oauth2Attributes = OAuth2Attributes.of(loginVO, principal.getAttributes());

        } else {
            // Case 3: 예상치 못한 타입
            log.error("Principal type is unexpected. Actual Type: {}", principal.getClass().getName());
            sendFailureRedirect(request, response, "인증 객체 타입 오류. 관리자에게 문의하세요.");
            return;
        }

        String userId = oauth2Attributes.getLoginVO().getUserId();
        String role = oauth2Attributes.getLoginVO().getRole();
        String userNickname = oauth2Attributes.getLoginVO().getUserNickname();
        boolean hasCharacter = oauth2Attributes.getLoginVO().isHasCharacter();
        Integer characterId = oauth2Attributes.getLoginVO().getCharacterId();
        String characterImageUrl = oauth2Attributes.getLoginVO().getCharacterImageUrl();
        Integer incubatorCount = oauth2Attributes.getLoginVO().getIncubatorCount();
        boolean isAdFree = oauth2Attributes.getLoginVO().isAdFree();
        Integer characterCount = oauth2Attributes.getLoginVO().getCharacterCount();

        String finalCharacterImageUrl = characterImageUrl;
        if (characterId == null) {
            finalCharacterImageUrl = null;
        }

        // JWT 토큰 생성
        String jwtToken = jwtTokenProvider.createToken(userId, role, userNickname, hasCharacter, finalCharacterImageUrl, incubatorCount, isAdFree, characterCount);
        log.info(">>> [OAuth2 Success] JWT Token issued for user: {}", userId);

        // 리다이렉션 URL 생성 및 실행
        String targetUrl = buildTargetUrl(jwtToken, oauth2Attributes, hasCharacter, finalCharacterImageUrl, incubatorCount, isAdFree, characterCount);
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }

    // 실패 리다이렉션 로직
    private void sendFailureRedirect(HttpServletRequest request, HttpServletResponse response, String errorMessage) throws IOException {
        String encodedErrorMessage = URLEncoder.encode(errorMessage, StandardCharsets.UTF_8);
        String failureUrl = FRONTEND_REDIRECT_URI + "/failure?error=" + encodedErrorMessage;
        getRedirectStrategy().sendRedirect(request, response, failureUrl);
    }

    /**
     * JWT 토큰과 사용자 정보를 포함하는 리다이렉션 URL 생성
     */
    private String buildTargetUrl(String jwtToken, OAuth2Attributes oauth2Attributes, boolean hasCharacter, String characterImageUrl, Integer incubatorCount, boolean isAdFree, Integer characterCount) {
        String userId = URLEncoder.encode(oauth2Attributes.getLoginVO().getUserId(), StandardCharsets.UTF_8);
        String nickname = URLEncoder.encode(oauth2Attributes.getLoginVO().getUserNickname(), StandardCharsets.UTF_8);
        String role = URLEncoder.encode(oauth2Attributes.getLoginVO().getRole(), StandardCharsets.UTF_8);
        String userEmail = URLEncoder.encode(oauth2Attributes.getLoginVO().getUserEmail(), StandardCharsets.UTF_8);
        String hasCharacterString = String.valueOf(hasCharacter);
        String incubatorCountString = String.valueOf(incubatorCount);
        String isAdFreeString = String.valueOf(isAdFree);
        String characterCountString = String.valueOf(characterCount);

        String encodedCharacterImageUrl = "";
        if (characterImageUrl != null) {
            encodedCharacterImageUrl = URLEncoder.encode(characterImageUrl, StandardCharsets.UTF_8);
        }

        return String.format("%s?token=%s&userId=%s&nickname=%s&role=%s&hasCharacter=%s&userEmail=%s&characterImageUrl=%s&incubatorCount=%s&isAdFree=%s&characterCount=%s",
                FRONTEND_REDIRECT_URI,
                jwtToken,
                userId,
                nickname,
                role,
                hasCharacterString,
                userEmail,
                encodedCharacterImageUrl,
                incubatorCountString,
                isAdFreeString,
                characterCountString
        );
    }

}
