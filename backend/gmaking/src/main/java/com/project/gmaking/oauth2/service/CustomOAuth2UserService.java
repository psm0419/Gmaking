package com.project.gmaking.oauth2.service;

import com.project.gmaking.login.dao.LoginDAO;
import com.project.gmaking.login.vo.LoginVO;
import com.project.gmaking.oauth2.userinfo.OAuth2UserInfo;
import com.project.gmaking.oauth2.userinfo.OAuth2UserInfoFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final LoginDAO loginDAO;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauth2User = super.loadUser(userRequest);
        String registrationId = userRequest.getClientRegistration().getRegistrationId();

        OAuth2UserInfo userInfo = OAuth2UserInfoFactory.getOAuth2UserInfo(registrationId, oauth2User.getAttributes());
        saveOrUpdate(userInfo, registrationId);

        // OIDC는 OidcUser 그대로 반환
        if (oauth2User instanceof OidcUser oidcUser) return oidcUser;

        return oauth2User;
    }

    private void saveOrUpdate(OAuth2UserInfo userInfo, String registrationId) {
        String socialId = registrationId + "_" + userInfo.getId();
        LoginVO user = loginDAO.selectUserBySocialId(socialId);

        if (user == null) {
            log.info(">>> [OAuth2] New User Registration: {}", socialId);
            registerNewUser(userInfo, socialId);
        }
    }

    private void registerNewUser(OAuth2UserInfo userInfo, String socialId) {
        String nickname = userInfo.getNickname();
        if (nickname == null || nickname.isEmpty()) {
            nickname = "소셜유저_" + UUID.randomUUID().toString().substring(0,6);
        }

        String email = userInfo.getEmail();
        if (email == null || email.isEmpty()) {
            email = socialId + "@social.gmaking.com";
        }

        LoginVO newUser = new LoginVO();
        newUser.setUserId(socialId);
        newUser.setUserEmail(email);
        newUser.setUserName(userInfo.getName());
        newUser.setUserNickname(nickname);
        newUser.setRole("ROLE_USER");
        newUser.setUserPassword("SOCIAL_USER");

        loginDAO.insertSocialUser(newUser);
    }
}
