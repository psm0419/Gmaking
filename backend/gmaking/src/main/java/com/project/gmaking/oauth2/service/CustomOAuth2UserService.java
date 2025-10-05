package com.project.gmaking.oauth2.service;

import com.project.gmaking.login.dao.LoginDAO;
import com.project.gmaking.login.vo.LoginVO;
import com.project.gmaking.oauth2.userinfo.OAuth2UserInfo;
import com.project.gmaking.oauth2.userinfo.OAuth2UserInfoFactory;
import com.project.gmaking.oauth2.vo.OAuth2Attributes;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final LoginDAO loginDAO;
    private final PasswordEncoder passwordEncoder;

    /**
     * 소셜 로그인 후 사용자 정보를 가져와 처리
     */
    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {

        try {
            OAuth2User oauth2User = super.loadUser(userRequest);
            String registrationId = userRequest.getClientRegistration().getRegistrationId();
            OAuth2UserInfo userInfo = OAuth2UserInfoFactory.getOAuth2UserInfo(registrationId, oauth2User.getAttributes());

            // socialId를 먼저 계산
            String socialId = registrationId + "_" + userInfo.getId();

            // OAuth2UserInfo를 기반으로 DB 처리
            LoginVO user = saveOrUpdate(userInfo, socialId);

            if (user == null) {
                log.error(">>> [OAuth2 FATAL] saveOrUpdate completed, but returned null unexpectedly for {}", socialId);
                // null 반환 시, 이 예외를 던져 FailureHandler로 넘어가게 합니다.
                throw new OAuth2AuthenticationException(new OAuth2Error("registration_error"), "사용자 객체를 찾을 수 없습니다.");
            }

            // Spring Security에서 사용할 OAuth2User 객체 생성
            return OAuth2Attributes.of(user, userInfo.getAttributes());

        } catch (Exception ex) {
            // DB 예외 발생 시 로그를 남기고, FailureHandler로 넘깁니다.
            log.error(">>> [OAuth2 ERROR] Exception during loadUser/registration: {}", ex.getMessage(), ex);
            throw new OAuth2AuthenticationException(new OAuth2Error("registration_error", "DB 처리 중 예외 발생: " + ex.getMessage(), null), ex);
        }
    }

    /**
     * DB에 사용자 정보가 있으면 업데이트, 없으면 신규 등록
     */
    private LoginVO saveOrUpdate(OAuth2UserInfo userInfo, String socialId) { // 🚨 socialId를 인자로 받도록 수정

        // DB에서 소셜 ID(USER_ID)로 기존 사용자 조회
        LoginVO user = loginDAO.selectUserBySocialId(socialId);

        if (user == null) {
            log.info(">>> [OAuth2] New User Registration: {}", socialId);
            user = registerNewUser(userInfo, socialId);
        } else {
            log.info(">>> [OAuth2] Existing User Login: {}", socialId);
        }

        return user;
    }

    /**
     * 신규 소셜 사용자 등록
     */
    private LoginVO registerNewUser(OAuth2UserInfo userInfo, String socialId) {

        // 임시 닉네임 설정 (USER_NICKNAME NOT NULL, UNIQUE 해결)
        String tempNickname = userInfo.getNickname();
        if (tempNickname == null || tempNickname.isEmpty()) {
            tempNickname = "소셜유저_" + UUID.randomUUID().toString().substring(0, 6);
        }

        // 이메일 값이 null인 경우 임시 이메일 생성 (USER_EMAIL UNIQUE 충족 시도)
        String userEmail = userInfo.getEmail();

        if (userEmail == null || userEmail.isEmpty()) {
            userEmail = socialId + "@social.com";
        }

        LoginVO newUser = new LoginVO();

        newUser.setUserId(socialId);
        newUser.setUserName(userInfo.getName());
        newUser.setUserEmail(userEmail);

        // USER_PASSWORD NOT NULL 제약조건을 맞추기 위해 더미 비밀번호를 암호화하여 저장
        String dummyPassword = java.util.UUID.randomUUID().toString();
        newUser.setUserPassword(passwordEncoder.encode(dummyPassword));

        newUser.setUserNickname(tempNickname);
        newUser.setRole("USER");
        newUser.setIsEmailVerified("Y");

        // DB 삽입 직전에 LoginVO 값 확인
        log.debug(">>> [OAuth2-Insert] Prepared newUser values: {}", newUser.toString());

        // DB 삽입
        loginDAO.insertSocialUser(newUser);

        return newUser;
    }

}