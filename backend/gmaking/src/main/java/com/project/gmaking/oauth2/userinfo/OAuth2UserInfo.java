package com.project.gmaking.oauth2.userinfo;

import java.util.Map;

public interface OAuth2UserInfo {
    String getId();
    String getEmail();
    String getName();
    String getNickname();
}
