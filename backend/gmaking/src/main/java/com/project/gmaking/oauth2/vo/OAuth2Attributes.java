package com.project.gmaking.oauth2.vo;

import com.project.gmaking.login.vo.LoginVO;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;

/**
 * Spring Security에서 OAuth2 인증 성공 후 사용될 사용자 정보 클래스.
 * 내부 LoginVO와 외부 OAuth2 속성을 모두 포함
 */
@Getter
public class OAuth2Attributes implements OAuth2User {

    private final LoginVO loginVO;
    private final Map<String, Object> attributes;
    private final Collection<? extends GrantedAuthority> authorities;

    public OAuth2Attributes(LoginVO loginVO, Map<String, Object> attributes) {
        this.loginVO = loginVO;
        this.attributes = attributes;
        this.authorities = Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + loginVO.getRole()));
    }

    /**
     * CustomOAuth2UserService에서 LoginVO를 사용하여 객체를 생성하는 팩토리 메소드
     */
    public static OAuth2Attributes of(LoginVO loginVO, Map<String, Object> attributes) {
        return new OAuth2Attributes(loginVO, attributes);
    }

    @Override
    public Map<String, Object> getAttributes() {
        return this.attributes;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return this.authorities;
    }

    // getName()은 JWT 발급 시 Subject(사용자 식별자)로 사용
    @Override
    public String getName() {
        return loginVO.getUserId();
    }
}