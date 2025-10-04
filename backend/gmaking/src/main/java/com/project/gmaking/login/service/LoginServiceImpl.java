package com.project.gmaking.login.service;

import com.project.gmaking.email.dao.EmailVerificationDAO;
import com.project.gmaking.email.service.EmailVerificationService;
import com.project.gmaking.login.dao.LoginDAO;
import com.project.gmaking.login.service.LoginService;
import com.project.gmaking.login.vo.LoginRequestVO;
import com.project.gmaking.login.vo.LoginVO;
import com.project.gmaking.login.vo.RegisterRequestVO;
import jakarta.mail.MessagingException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.io.UnsupportedEncodingException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@RequiredArgsConstructor
public class LoginServiceImpl implements LoginService {

    private static final Logger log = LoggerFactory.getLogger(LoginServiceImpl.class);

    private final LoginDAO loginDAO;
    private final PasswordEncoder passwordEncoder;
    private final EmailVerificationService verificationService;
    private final EmailVerificationDAO verificationDAO;

    @Override
    public LoginVO authenticate(LoginRequestVO requestVO) {
        // DB에서 사용자 ID로 전체 정보 조회
        LoginVO user = loginDAO.selectUserById(requestVO.getUserId());

        // 사용자 존재 여부 확인
        if (user == null) {
            return null; // 사용자 ID 없음
        }

        // 비밀번호 일치 여부 확인 (암호화된 비밀번호 비교)
        if (passwordEncoder.matches(requestVO.getUserPassword(), user.getUserPassword())) {
            if (!"Y".equals(user.getIsEmailVerified())) {
                throw new IllegalArgumentException("이메일 인증이 완료되지 않은 사용자입니다.");
            }

            // 로그인 성공, 보안을 위해 비밀번호 필드는 제거하고 반환
            user.setUserPassword(null);

            return user;
        } else {
            // 비밀번호 불일치
            return null;
        }

    }

    /**
     * 회원가입 로직
     */
    @Override
    @Transactional
    public LoginVO register(RegisterRequestVO requestVO) {
        log.info(">>>> [REGISTER-TRACE] 1. 회원가입 요청 시작: ID={}", requestVO.getUserId());

        // 중복 확인
        if (isDuplicate("userId", requestVO.getUserId())) {
            throw new IllegalArgumentException("이미 사용 중인 아이디입니다.");
        }
        if (isDuplicate("userNickname", requestVO.getUserNickname())) {
            throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
        }
        if (isDuplicate("userEmail", requestVO.getUserEmail())) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }

        log.info(">>>> [REGISTER-TRACE] 2. 중복 확인 완료. DB 저장 시도.");

        // 비밀번호 암호화
        String encodedPassword = passwordEncoder.encode(requestVO.getUserPassword());
        requestVO.setUserPassword(encodedPassword);

        // 사용자 정보 DB 저장
        int insertedRow = loginDAO.insertUser(requestVO);

        if (insertedRow != 1) {
            throw new RuntimeException("회원가입에 실패했습니다. DB 삽입 오류.");
        }

        // 이메일 인증 코드 발송 요청
        try {
            verificationService.sendCode(requestVO.getUserId(), requestVO.getUserEmail());
            log.info(">>>> [REGISTER-TRACE] 4. 이메일 발송 성공.");
        } catch (MessagingException | UnsupportedEncodingException e) {
            log.error(">>>> [REGISTER-ERROR] 이메일 발송 중 오류 발생. ID: {}", requestVO.getUserId(), e);
            throw new RuntimeException("인증 이메일 발송에 실패했습니다. 이메일 주소를 확인해주세요. 오류: " + e.getMessage(), e);
        }

        // 저장 후, 로그인에 사용할 VO 형태로 변환하여 반환
        LoginVO newUser = new LoginVO();
        newUser.setUserId(requestVO.getUserId());
        newUser.setUserName(requestVO.getUserName());
        newUser.setUserEmail(requestVO.getUserEmail());
        newUser.setUserNickname(requestVO.getUserNickname());
        newUser.setRole("USER");

        log.info(">>>> [REGISTER-TRACE] 5. 회원가입 트랜잭션 완료.");
        return newUser;
    }

    /**
     * ID, 닉네임, 이메일 중복 확인 로직
     */
    @Override
    public boolean isDuplicate(String type, String value) {
        if (!"userId".equals(type) && !"userNickname".equals(type) && !"userEmail".equals(type)) {
            // 유효하지 않은 타입이 들어왔을 경우
            throw new IllegalArgumentException("유효하지 않은 중복 확인 타입입니다.");
        }

        // DB에서 해당 값의 카운트를 조회
        return loginDAO.checkDuplicate(type, value) > 0;
    }

    /**
     * 이메일 인증 완료 후 TB_USER의 인증 상태 업데이트
     */
    @Override
    @Transactional
    public void completeEmailVerification(String userId) {
        // TB_USER 테이블의 is_email_verified 컬럼을 'Y'로 업데이트
        verificationDAO.updateIsEmailVerifiedInUser(userId, "Y");
    }

}