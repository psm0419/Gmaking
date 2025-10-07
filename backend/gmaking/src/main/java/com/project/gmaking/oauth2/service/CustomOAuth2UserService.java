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

            // 소셜 서비스에서 가져온 이메일
            String userEmail = userInfo.getEmail();

            // 소셜 로그인 중복 방지
            if (userEmail != null && !userEmail.isEmpty()) {
                // 이메일로 기존 사용자 조회
                LoginVO existingUserByEmail = loginDAO.selectUserByEmail(userEmail);

                if (existingUserByEmail != null) {
                    String existingUserId = existingUserByEmail.getUserId();

                    // 다른 소셜로 가입한 경우
                    if (!existingUserId.startsWith(registrationId + "_")) {

                        // 기존 가입된 소셜 제공자 이름 추출
                        int underscoreIndex = existingUserId.indexOf('_');
                        String existingProvider = "일반 계정";
                        if (underscoreIndex > 0) {
                            existingProvider = existingUserId.substring(0, underscoreIndex);
                        }

                        String errorMessage = String.format(
                                "이미 다른 계정(%s)으로 가입된 이메일입니다. 해당 계정으로 로그인해주세요.",
                                existingProvider.toUpperCase()
                        );

                        log.error(">>>> [OAuth2-Conflict] Email already exists with another provider: {}", existingProvider);
                        // OAuth2 인증 예외 발생
                        throw new OAuth2AuthenticationException(new OAuth2Error("email_conflict"), errorMessage);
                    }
                }
            }

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

        } catch (OAuth2AuthenticationException ex) {

            throw ex;

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

        // 임시 닉네임 설정 (NOT NULL, UNIQUE 해결)
        String baseNickname = userInfo.getNickname();
        if (baseNickname == null || baseNickname.isEmpty()) {
            // 소셜에서 닉네임을 가져오지 못할 경우 기본 값 사용
            baseNickname = "소셜유저";
        }

        // 닉네임 중복 검사 및 고유한 닉네임 생성 로직
        String uniqueNickname = baseNickname;
        int counter = 0;

        // 닉네임 중복 체크 (DB에 해당 닉네임이 존재하는지 확인)
        while (loginDAO.checkDuplicate("userNickname", uniqueNickname) > 0) {
            counter++;
            // 중복이면 카운터를 붙여서 고유한 닉네임
            uniqueNickname = baseNickname + "_" + counter;

            // 안전 장치
            if (counter > 100) {
                log.error(">>> [OAuth2-Nickname-Error] Failed to generate unique nickname for: {}", baseNickname);
                throw new RuntimeException("닉네임 고유성 확보 실패");
            }
        }

        // 이메일 값이 null인 경우 임시 이메일 생성 (USER_EMAIL NOT NULL, UNIQUE 해결)
        String userEmail = userInfo.getEmail();

        if (userEmail == null || userEmail.isEmpty()) {
            userEmail = socialId + "@social.com";
        }

        LoginVO newUser = new LoginVO();

        newUser.setUserId(socialId);
        newUser.setUserName(userInfo.getName());
        newUser.setUserEmail(userEmail);

        // USER_PASSWORD NOT NULL 제약조건을 맞추기 위해 더미 비밀번호를 암호화
        String dummyPassword = java.util.UUID.randomUUID().toString();
        newUser.setUserPassword(passwordEncoder.encode(dummyPassword));

        // 고유한 닉네임 설정
        newUser.setUserNickname(uniqueNickname);
        newUser.setRole("USER");
        newUser.setIsEmailVerified("Y");

        // DB 삽입 직전에 LoginVO 값 확인
        log.debug(">>> [OAuth2-Insert] Prepared newUser values: {}", newUser.toString());

        // DB 삽입
        loginDAO.insertSocialUser(newUser);

        return newUser;

    }

}
