package com.project.gmaking.oauth2.userinfo;

import java.util.Map;

public class NaverOAuth2UserInfo implements OAuth2UserInfo {

    private final Map<String, Object> attributes;

    public NaverOAuth2UserInfo(Map<String, Object> attributes) {
        this.attributes = attributes;
    }

    // Naver는 response 안에 유저 정보가 들어 있음
    private Map<String, Object> getResponse() {
        return (Map<String, Object>) attributes.get("response");
    }

    @Override
    public String getId() {
        return (String) getResponse().get("id");
    }

    @Override
    public String getEmail() {
        return (String) getResponse().get("email");
    }

    @Override
    public String getName() {
        return (String) getResponse().get("name");
    }

    @Override
    public String getNickname() {
        return (String) getResponse().get("nickname");
    }
}
