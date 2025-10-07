package com.project.gmaking.oauth2.userinfo;

import java.util.Map;

public class NaverOAuth2UserInfo extends OAuth2UserInfo {

    private final Map<String, Object> response; // 네이버는 사용자 정보를 'response' 키 아래에 담아 보냄

    public NaverOAuth2UserInfo(Map<String, Object> attributes) {
        super(attributes);
        this.response = (Map<String, Object>) attributes.get("response");
    }

    @Override
    public String getId() {
        return (String) response.get("id");
    }

    @Override
    public String getName() {
        return (String) response.get("name");
    }

    @Override
    public String getEmail() {
        return (String) response.get("email");
    }

    @Override
    public String getNickname() {
        return (String) response.get("nickname");
    }

    @Override
    public String getImageUrl() {
        return (String) response.get("profile_image");
    }
}
