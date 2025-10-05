package com.project.gmaking.oauth2.userinfo;

import java.util.Map;

public class OAuth2UserInfoFactory {

    public static OAuth2UserInfo getOAuth2UserInfo(String registrationId, Map<String, Object> attributes) {
        return switch (registrationId.toLowerCase()) {
            case "google" -> new GoogleOAuth2UserInfo(attributes);
            case "kakao" -> new KakaoOAuth2UserInfo(attributes);
            case "naver" -> new NaverOAuth2UserInfo(attributes);
            default -> throw new IllegalArgumentException("Unsupported OAuth2 provider: " + registrationId);
        };
    }

    public static OAuth2UserInfo getOAuth2UserInfo(String registrationId, Object attributes) {
        if (!(attributes instanceof Map<?, ?> map)) {
            throw new IllegalArgumentException("Attributes must be of type Map");
        }
        return getOAuth2UserInfo(registrationId, (Map<String, Object>) map);
    }
}
