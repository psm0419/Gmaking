package com.project.gmaking.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())                 // CSRF 끔 (POST/PUT 등 테스트 편하게)
                .authorizeHttpRequests(auth -> auth
                        .anyRequest().permitAll()                // 모든 요청 허용
                )
                .formLogin(form -> form.disable())           // 기본 로그인 폼 끔
                .httpBasic(basic -> basic.disable());        // 브라우저 Basic 인증 끔
        return http.build();
    }
}
