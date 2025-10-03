package com.project.gmaking.config;

import com.project.gmaking.security.JwtAuthenticationFilter;
import com.project.gmaking.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtTokenProvider jwtTokenProvider;

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
            // CSRF 보호 비활성화 & HTTP Basic 인증 및 Form Login 비활성화
            .csrf(csrf -> csrf.disable())
            .httpBasic(httpBasic -> httpBasic.disable())

            // 세션을 사용하지 않도록 설정 (JWT 사용 시 필수)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // 요청에 대한 권한 설정
            .authorizeHttpRequests(auth -> auth
                    // 로그인 경로는 인증 없이 누구나 접근 가능하도록 허용
                    .requestMatchers("/api/login").permitAll()

                    // 나머지 모든 요청은 인증된 사용자에게만 허용
                    .anyRequest().authenticated()
            )

            // JWT 필터 추가
            .addFilterBefore(
                new JwtAuthenticationFilter(jwtTokenProvider),
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }
}