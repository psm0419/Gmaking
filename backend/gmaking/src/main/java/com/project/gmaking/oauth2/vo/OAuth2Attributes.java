package com.project.gmaking.oauth2.vo;

import com.project.gmaking.login.vo.LoginVO;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.OidcUserInfo;
import org.springframework.security.oauth2.core.oidc.user.OidcUser; // OidcUser import
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;

@Getter
// OAuth2User와 OidcUser 인터페이스 모두 구현
public class OAuth2Attributes implements OAuth2User, OidcUser {

    private final LoginVO loginVO;
    private final Map<String, Object> attributes;
    private final Collection<? extends GrantedAuthority> authorities;
    private final OidcIdToken idToken;

    public OAuth2Attributes(LoginVO loginVO, Map<String, Object> attributes, OidcIdToken idToken) {
        this.loginVO = loginVO;
        this.attributes = attributes;
        this.authorities = Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + loginVO.getRole()));
        this.idToken = idToken;
    }

    // Naver/Kakao 등 OAuth2 전용 팩토리 메소드
    public static OAuth2Attributes of(LoginVO loginVO, Map<String, Object> attributes) {
        // idToken이 필요 없으므로 null로 넘김
        return new OAuth2Attributes(loginVO, attributes, null);
    }

    // Google 등 OIDC 전용 팩토리 메소드
    public static OAuth2Attributes of(LoginVO loginVO, Map<String, Object> attributes, OidcIdToken idToken) {
        return new OAuth2Attributes(loginVO, attributes, idToken);
    }

    // ----------------------------------------------------
    // OidcUser 인터페이스 메서드 구현
    // ----------------------------------------------------

    @Override
    public Map<String, Object> getClaims() {
        // OidcUser의 핵심 메서드: 클레임을 반환합니다.
        // 저희는 Attributes를 그대로 클레임으로 사용합니다.
        return this.attributes;
    }

    @Override
    public OidcUserInfo getUserInfo() {
        // 필수 구현이 아니지만, 구현하는 것이 좋습니다.
        return new OidcUserInfo(this.attributes);
    }

    @Override
    public OidcIdToken getIdToken() {
        return this.idToken;
    }

    // ----------------------------------------------------
    // OAuth2User/Principal 인터페이스 메서드 구현
    // ----------------------------------------------------

    @Override
    public Map<String, Object> getAttributes() {
        return this.attributes;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return this.authorities;
    }

    @Override
    public String getName() {
        // Spring Security에서 Principal의 고유 식별자로 사용됩니다.
        return this.loginVO.getUserId();
    }
}