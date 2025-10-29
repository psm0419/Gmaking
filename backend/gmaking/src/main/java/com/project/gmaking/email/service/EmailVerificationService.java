package com.project.gmaking.email.service;

import com.project.gmaking.email.dao.EmailVerificationDAO;
import com.project.gmaking.email.vo.EmailVerificationVO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.io.UnsupportedEncodingException;
import jakarta.mail.MessagingException;
import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private final EmailService emailService;
    private final EmailVerificationDAO verificationDAO;

    @Value("${email.verification.expiry-seconds}")
    private long expirySeconds;

    /**
     * 인증 코드를 생성하고 DB에 저장 후 이메일을 발송
     */
    @Transactional
    public void sendCode(String userId, String userEmail) throws MessagingException, UnsupportedEncodingException {

        // 6자리 랜덤 인증 코드 생성
        String verifyCode = generateRandomCode();

        // 만료 시간 설정
        LocalDateTime expiryDate = LocalDateTime.now().plusSeconds(expirySeconds);

        // DB에 저장
        EmailVerificationVO vo = new EmailVerificationVO();
        vo.setUserId(userId);
        vo.setEmail(userEmail);
        vo.setVerifyCode(verifyCode);
        vo.setExpiryDate(expiryDate);
        verificationDAO.saveVerificationCode(vo);

        // 이메일 발송
        String subject = "[겜만중] 이메일 인증 코드입니다.";
        String htmlContent = generateEmailContent(verifyCode, expirySeconds / 60);

        emailService.sendVerificationEmail(userEmail, subject, htmlContent);
    }

    /**
     * 사용자 입력 인증 코드를 검증하고 성공 시 DB 상태를 업데이트
     * @return 검증 성공 시 true, 실패 시 false
     */
    @Transactional
    public boolean verifyCode(String userId, String userEmail, String inputCode) {

        // DB에서 인증 정보 조회
        EmailVerificationVO storedInfo = verificationDAO.getVerificationInfo(userId, userEmail);

        if (storedInfo == null) {
            return false; // 인증 정보 없음
        }

        // 코드, 만료 시간, 기존 인증 여부 확인
        if (!storedInfo.getVerifyCode().equals(inputCode)) {
            return false; // 코드가 일치하지 않음
        }

        if (storedInfo.getExpiryDate().isBefore(LocalDateTime.now())) {
            return false; // 만료됨
        }

        // 3. 이미 인증된 코드인지 확인
        if ("Y".equals(storedInfo.getIsVerified())) {
            // 이미 인증 완료된 코드를 다시 입력한 경우, 성공으로 간주해도 무방
            return true;
        }

        // 인증 성공: 상태 업데이트
        verificationDAO.updateVerificationStatus(userId, "Y");

        return true;

    }

    // 헬퍼: 6자리 랜덤 숫자 생성
    private String generateRandomCode() {
        Random random = new Random();
        int code = random.nextInt(900000) + 100000; // 100000 ~ 999999
        return String.valueOf(code);
    }

    // 헬퍼: 이메일 HTML 콘텐츠 생성
    private String generateEmailContent(String code, long expiryMinutes) {
        return "<div style=\"font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px; max-width: 600px; margin: auto; text-align: center;\">"
                + "<h2 style=\"color: #ffc107;\">이메일 인증</h2>"
                + "<p>안녕하세요, 겜만중입니다.</p>"
                + "<p>아래 인증 코드를 입력해주세요.</p>"
                + "<div style=\"background-color: #343a40; color: #ffffff; padding: 15px; border-radius: 5px; margin: 20px 0;\">"
                + "<strong style=\"font-size: 24px; letter-spacing: 5px;\">" + code + "</strong>"
                + "</div>"
                + "<p style=\"color: #dc3545; font-size: 14px;\">이 코드는 발송 시점부터 " + expiryMinutes + "분 동안 유효합니다.</p>"
                + "<p style=\"font-size: 12px; color: #6c757d;\">문의사항은 관리자에게 연락주세요.</p>"
                + "</div>";
    }
}