package com.project.gmaking.oauth2.userinfo;

import java.util.Map;

/**
 * 소셜 서비스별 사용자 정보 규격 통일을 위한 추상 클래스
 */
public abstract class OAuth2UserInfo {
    // 하위 클래스에서 접근할 수 있도록 protected로 선언
    protected Map<String, Object> attributes;

    public OAuth2UserInfo(Map<String, Object> attributes) {
        this.attributes = attributes;
    }

    // 원본 데이터를 반환
    public Map<String, Object> getAttributes() {
        return attributes;
    }

    // 각 소셜별로 구현해야 할 메소드 (abstract)
    public abstract String getId();
    public abstract String getName();
    public abstract String getEmail();
    public abstract String getNickname();
    public abstract String getImageUrl();

}
