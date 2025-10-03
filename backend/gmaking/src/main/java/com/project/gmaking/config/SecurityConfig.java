package com.project.gmaking.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /**
     * 비밀번호 암호화 Bean 등록 (BCrypt 사용)
     * 이 객체는 LoginServiceImpl에서 사용됩니다.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Spring Security 기본 필터 체인 설정
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // 1. CSRF 보호 비활성화
                .csrf(csrf -> csrf.disable())

                // 2. HTTP Basic 인증 및 Form Login 비활성화
                .httpBasic(httpBasic -> httpBasic.disable()) // <--- 이 줄을 추가
                // .formLogin(formLogin -> formLogin.disable()) // formLogin이 기본적으로 비활성화된 경우 불필요

                // 3. 요청에 대한 권한 설정 (순서가 맞는지 확인)
                .authorizeHttpRequests(auth -> auth
                        // 로그인 경로는 인증 없이 누구나 접근 가능하도록 허용
                        .requestMatchers("/api/login").permitAll()

                        // 나머지 모든 요청은 인증된 사용자에게만 허용
                        .anyRequest().authenticated()
                );

        return http.build();
    }
}