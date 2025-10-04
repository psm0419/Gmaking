package com.project.gmaking.oauth2.service;

import com.project.gmaking.login.dao.LoginDAO;
import com.project.gmaking.login.vo.LoginVO;
import com.project.gmaking.oauth2.userinfo.OAuth2UserInfo;
import com.project.gmaking.oauth2.userinfo.OAuth2UserInfoFactory;
import com.project.gmaking.oauth2.vo.OAuth2Attributes;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final LoginDAO loginDAO; // 기존 LoginDAO 사용

    /**
     * 소셜 로그인 후 사용자 정보를 가져와 처리
     */
    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        // DefaultOAuth2UserService를 사용하여 사용자 정보 로드
        OAuth2User oauth2User = super.loadUser(userRequest);

        // 소셜 타입 (google, naver, kakao) 추출
        String registrationId = userRequest.getClientRegistration().getRegistrationId();

        // 사용자 정보 파싱을 위한 Factory 사용
        OAuth2UserInfo userInfo = OAuth2UserInfoFactory.getOAuth2UserInfo(registrationId, oauth2User.getAttributes());

        // OAuth2UserInfo를 기반으로 DB 처리
        LoginVO user = saveOrUpdate(userInfo, registrationId);

        // Spring Security에서 사용할 OAuth2User 객체 생성 (JWT 발급에 필요)
        return OAuth2Attributes.of(user, userInfo.getAttributes());
    }

    /**
     * DB에 사용자 정보가 있으면 업데이트, 없으면 신규 등록
     */
    private LoginVO saveOrUpdate(OAuth2UserInfo userInfo, String registrationId) {

        // 소셜 타입과 이메일을 조합하여 고유한 ID 생성
        String socialId = registrationId + "_" + userInfo.getEmail();

        // DB에서 소셜 ID(이메일)로 기존 사용자 조회
        // DB에 소셜 ID(USER_ID)를 기준으로 조회하는 메소드가 필요합니다.
        LoginVO user = loginDAO.selectUserBySocialId(socialId);

        if (user == null) {
            // 2. 신규 사용자: 회원가입 처리
            log.info(">>> [OAuth2] New User Registration: {}", socialId);
            user = registerNewUser(userInfo, socialId);
        } else {
            // 3. 기존 사용자: 정보 업데이트 (닉네임/이미지 등)
            log.info(">>> [OAuth2] Existing User Update: {}", socialId);
        }

        return user;
    }

    /**
     * 신규 소셜 사용자 등록
     */
    private LoginVO registerNewUser(OAuth2UserInfo userInfo, String socialId) {
        // 기존 LoginDAO의 insertUser 메서드는 RegisterRequestVO를 사용하므로,
        // 소셜 로그인용 신규 DAO 메서드를 사용하는 것이 더 깔끔합니다.

        // 임시 닉네임 설정 (추후 유저가 변경하도록 유도)
        String tempNickname = userInfo.getNickname();
        if (tempNickname == null || tempNickname.isEmpty()) {
            tempNickname = "소셜유저_" + UUID.randomUUID().toString().substring(0, 6);
        }

        LoginVO newUser = new LoginVO();
        newUser.setUserId(socialId);
        newUser.setUserEmail(userInfo.getEmail());
        newUser.setUserName(userInfo.getName());
        newUser.setUserNickname(tempNickname);
        newUser.setRole("USER");
        newUser.setUserPassword("SOCIAL_USER");

        // DB에 삽입
        loginDAO.insertSocialUser(newUser);

        return newUser;
    }

}