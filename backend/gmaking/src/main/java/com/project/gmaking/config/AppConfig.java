package com.project.gmaking.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * 애플리케이션 전반에 걸쳐 사용되는 공통 Bean 설정 클래스
 */
@Configuration
public class AppConfig {

    /**
     * 비밀번호 암호화에 사용할 PasswordEncoder Bean 등록
     * BCrypt 알고리즘 사용 (SecurityConfig에서 이동)
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}