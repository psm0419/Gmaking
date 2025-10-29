package com.project.gmaking.login.service;

import com.project.gmaking.email.dao.EmailVerificationDAO;
import com.project.gmaking.email.service.EmailVerificationService;
import com.project.gmaking.email.vo.EmailVerificationVO;
import com.project.gmaking.login.dao.LoginDAO;
import com.project.gmaking.login.service.LoginService;
import com.project.gmaking.login.vo.LoginRequestVO;
import com.project.gmaking.login.vo.LoginVO;
import com.project.gmaking.login.vo.RegisterRequestVO;
import com.project.gmaking.quest.service.QuestService;
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
    private final QuestService questService;

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

            // 로그인 성공 시 일일 퀘스트 자동 부여
            questService.initializeDailyQuests(user.getUserId());

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
        int insertedRow = loginDAO.register(requestVO);

        if (insertedRow != 1) {
            throw new RuntimeException("회원가입에 실패했습니다. DB 삽입 오류.");
        }

        // 무료 부화기 (PRODUCT_ID 5) 1개를 인벤토리에 지급
        final int FREE_INCUBATOR_PRODUCT_ID = 5;
        final int QUANTITY = 1;

        try {
            loginDAO.insertUserInventory(requestVO.getUserId(), FREE_INCUBATOR_PRODUCT_ID, QUANTITY);
            log.info(">>>> [REGISTER-TRACE] 3. 무료 부화권(ID: {}) 1개를 인벤토리에 지급 완료.", FREE_INCUBATOR_PRODUCT_ID);
        } catch (Exception e) {
            // 인벤토리 삽입 실패 시 회원가입 트랜잭션 롤백 유도를 위해 RuntimeException 처리
            log.error(">>>> [REGISTER-ERROR] 인벤토리 삽입 중 오류 발생. ID: {}", requestVO.getUserId(), e);
            throw new RuntimeException("회원가입에 실패했습니다. (인벤토리 지급 오류)", e);
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

    /**
     * 아이디 찾기: 이름/이메일로 ID 조회 및 인증 코드 발송
     */
    @Override
    public String findIdAndSendVerification(String userName, String userEmail) throws Exception {
        // 이름과 이메일로 사용자 ID 조회
        String userId = loginDAO.findUserIdByNameAndEmail(userName, userEmail);

        if (userId == null) {
            throw new IllegalArgumentException("일치하는 사용자 정보가 없습니다.");
        }

        // 이메일 인증 코드를 발송하고 DB에 저장
        verificationService.sendCode(userId, userEmail);

        // 인증 코드가 발송된 userId를 반환
        return userId;
    }

    /**
     * 아이디 찾기: 인증 코드 검증 후 아이디 반환 (마스킹 처리)
     */
    @Override
    public String verifyCodeAndGetUserId(String userId) {

        LoginVO user = loginDAO.selectUserById(userId);

        if (user == null) {
            throw new IllegalArgumentException("사용자 정보를 찾을 수 없습니다.");
        }

        EmailVerificationVO storedInfo = verificationDAO.getVerificationInfo(userId, user.getUserEmail());

        if (storedInfo == null || !"Y".equals(storedInfo.getIsVerified())) {
            throw new IllegalArgumentException("인증 코드를 확인해주세요. (인증이 완료되지 않았습니다.)");
        }

        // 인증 완료 후 인증 기록 삭제
        verificationDAO.deleteVerificationInfoByUserId(userId);

//        // 아이디 마스킹 처리
//        String maskedUserId;
//        if (userId.length() > 3) {
//            maskedUserId = userId.substring(0, 3) + "***" + userId.substring(6); // 예: user***id
//        } else {
//            maskedUserId = userId.substring(0, 1) + "***";
//        }

        return userId;
    }

    /**
     * 비밀번호 찾기: ID/이메일로 사용자 조회 및 인증 코드 발송
     */
    @Override
    public void findPasswordAndSendVerification(String userId, String userEmail) throws Exception {
        // 사용자 정보 조회 (ID와 이메일 동시 확인)
        LoginVO user = loginDAO.selectUserById(userId);

        if (user == null || !userEmail.equalsIgnoreCase(user.getUserEmail())) {
            // ID가 없거나 이메일이 일치하지 않는 경우
            throw new IllegalArgumentException("아이디 또는 이메일 정보가 일치하지 않습니다.");
        }

        // 이메일 인증 코드를 발송하고 DB에 저장
        verificationService.sendCode(userId, userEmail);
    }

    /**
     * 비밀번호 변경 처리
     */
    @Transactional
    @Override
    public void changePassword(String userId, String userEmail, String newRawPassword) {

        // 인증 상태 확인 및 인증 기록 삭제
        EmailVerificationVO storedInfo = verificationDAO.getVerificationInfo(userId, userEmail);

        // 인증 기록이 없거나 인증이 완료되지 않은 경우
        if (storedInfo == null || !"Y".equals(storedInfo.getIsVerified())) {
            throw new IllegalArgumentException("비밀번호를 변경하려면 이메일 인증을 먼저 완료해야 합니다.");
        }

        // 새 비밀번호 유효성 검사
        if (newRawPassword.length() < 8) {
            throw new IllegalArgumentException("비밀번호는 최소 8자 이상이어야 합니다.");
        }

        // 새 비밀번호 암호화
        String newHashedPassword = passwordEncoder.encode(newRawPassword);

        // DB 업데이트
        int updateCount = loginDAO.updatePassword(userId, newHashedPassword);

        if (updateCount == 0) {
            throw new RuntimeException("비밀번호 변경에 실패했습니다. (사용자 정보 없음)");
        }

        // 인증 기록 삭제 (재사용 방지)
        verificationDAO.deleteVerificationInfoByUserId(userId);

    }

    /**
     * 회원 탈퇴 처리 구현 (비밀번호 검증 후 사용자/인증 기록 삭제)
     */
    @Transactional
    @Override
    public void withdrawUser(String userId, String rawPassword) {

        // 사용자 정보 조회
        LoginVO user = loginDAO.selectUserById(userId);
        if (user == null) {
            throw new IllegalArgumentException("사용자를 찾을 수 없습니다.");
        }

        // 비밀번호 확인: 사용자가 입력한 비밀번호(rawPassword)와 암호화된 비밀번호(user.getUserPassword()) 비교
        if (!passwordEncoder.matches(rawPassword, user.getUserPassword())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        // 이메일 인증 기록 삭제
        verificationDAO.deleteVerificationInfoByUserId(userId);

        // 사용자 계정 삭제
        int userDeleteCount = loginDAO.deleteUser(userId);

        if (userDeleteCount == 0) {
            // 이메일 인증 기록 삭제는 성공했으나 사용자 계정 삭제 실패 시
            throw new RuntimeException("회원 탈퇴 처리 중 오류가 발생했습니다.");
        }

    }

    /**
     * 소셜 회원 탈퇴 처리 구현
     */
    @Transactional
    @Override
    public void withdrawSocialUser(String userId) {
        // 사용자 존재 여부 확인
        LoginVO user = loginDAO.selectUserById(userId);

        if (user == null) {
            throw new IllegalArgumentException("존재하지 않는 사용자입니다.");
        }

        // 이메일 인증 기록 삭제 (하드코딩)
        verificationDAO.deleteVerificationInfoByUserId(userId);

        // 사용자 계정 삭제 (TB_USER)
        int deleteCount = loginDAO.deleteUser(userId);

        if (deleteCount == 0) {
            log.error("[Withdrawal Failed] User deletion failed for ID: {}", userId);
            throw new RuntimeException("회원 탈퇴 처리 중 오류가 발생했습니다.");
        }

        log.info("[Withdrawal Success] Social User ID: {} has been successfully withdrawn.", userId);
    }

}