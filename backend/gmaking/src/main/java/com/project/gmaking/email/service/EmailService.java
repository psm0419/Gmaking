package com.project.gmaking.email.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.io.UnsupportedEncodingException;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender javaMailSender;

    @Value("${spring.mail.username}")
    private String senderEmail;

    @Value("${email.verification.sender-name}")
    private String senderName;

    /**
     * HTML 형식의 이메일을 발송
     * @param to 수신자 이메일 주소
     * @param subject 이메일 제목
     * @param htmlContent HTML 형식의 내용
     * @throws MessagingException 메일 발송 실패 시
     */
    public void sendVerificationEmail(String to, String subject, String htmlContent)
            throws MessagingException, UnsupportedEncodingException {

        MimeMessage message = javaMailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        // 보내는 사람 설정: 겜만중 관리자 <senderEmail>
        helper.setFrom(senderEmail, senderName);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);

        javaMailSender.send(message);
    }

}