package com.project.gmaking.config;


import com.project.gmaking.security.JwtAuthenticationFilter;
import com.project.gmaking.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

// CORS 관련 임포트
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import com.project.gmaking.oauth2.handler.OAuth2AuthenticationSuccessHandler;
import com.project.gmaking.oauth2.service.CustomOAuth2UserService;
import com.project.gmaking.oauth2.handler.OAuth2AuthenticationFailureHandler;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtTokenProvider jwtTokenProvider;
    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;
    private final OAuth2AuthenticationFailureHandler oAuth2AuthenticationFailureHandler;

    /**
     * Spring Security에서 사용할 CORS 설정 Bean
     * http://localhost:3000 에서의 요청을 허용
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // React 개발 서버 주소만 허용
        configuration.setAllowedOrigins(List.of("http://localhost:3000"));

        // 모든 HTTP 메서드 허용 (GET, POST, OPTIONS 등)
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));

        // 모든 헤더 허용 ('Authorization' 헤더 포함)
        configuration.setAllowedHeaders(List.of("*"));

        // 인증 정보 (JWT 토큰)를 주고받을 수 있도록 설정
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration); // 모든 URL 경로에 적용
        return source;
    }

    /**
     * Spring Security 기본 필터 체인 설정
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // CORS 설정을 Spring Security에 적용
                .cors(Customizer.withDefaults())

                // CSRF 보호 비활성화 & HTTP Basic 인증 및 Form Login 비활성화
                .csrf(csrf -> csrf.disable())
                .httpBasic(httpBasic -> httpBasic.disable())

                // 세션을 사용하지 않도록 설정 (JWT 사용 시 필수)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // 요청에 대한 권한 설정
                .authorizeHttpRequests(auth -> auth

                        // 모든 OPTIONS 요청을 인증 없이 허용
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // 로그인 및 회원가입 경로는 인증 없이 누구나 접근 가능하도록 허용
                        .requestMatchers("/login", "/api/login", "/api/register").permitAll()

                        // 이메일 관련 API(인증 코드 발송/검증) 누구나 접근 허용
                        .requestMatchers("/api/email/**").permitAll()

                        // ID/비밀번호 찾기 관련 API 누구나 접근 허용
                        .requestMatchers("/api/find-id/**", "/api/find-password/**").permitAll()

                        // 명시적 설정: /api/secured/** 경로는 JWT 인증된 사용자만 접근 허용
                        .requestMatchers("/api/secured/**").authenticated()

                        // 'static' 폴더에 매핑된 '/images/' 경로의 모든 파일 허용
                        .requestMatchers("/images/**").permitAll()

                        //  PVE 관련: 맵 조회는 비로그인도 허용
                        .requestMatchers("/api/pve/maps").permitAll()

                        // 맵 ID를 경로 변수로 받는 /api/pve/maps/{mapId}/image 엔드포인트를 허용합니다.
                        .requestMatchers("/api/pve/maps/*/image").permitAll()

                        // 캐릭터 목록 조회 API 허용 (현재 PveBattlePage.js에서 사용 중)
                        .requestMatchers("/api/characters").permitAll()
                        // 회원탈퇴
                        .requestMatchers("/api/user/withdraw").authenticated()

                        // 나머지 모든 요청은 인증된 사용자에게만 허용
                        .anyRequest().authenticated()
                )

                // OAuth2 로그인 설정 추가
                .oauth2Login(oauth2 -> oauth2
                        // 사용자 정보 로드 서비스 설정
                        .userInfoEndpoint(userInfo -> userInfo
                                .userService(customOAuth2UserService)
                        )

                        // 인증 성공 핸들러 설정 (JWT 발급 및 리다이렉션 처리)
                        .successHandler(oAuth2AuthenticationSuccessHandler)

                        .failureHandler(oAuth2AuthenticationFailureHandler)
                )

                // JWT 필터 추가
                .addFilterBefore(
                        new JwtAuthenticationFilter(jwtTokenProvider), UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

}
