package com.project.gmaking.config;


import com.project.gmaking.security.JwtAuthenticationFilter;
import com.project.gmaking.security.JwtTokenProvider;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

// CORS 관련 임포트
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import com.project.gmaking.oauth2.handler.OAuth2AuthenticationSuccessHandler;
import com.project.gmaking.oauth2.service.CustomOAuth2UserService;
import com.project.gmaking.oauth2.handler.OAuth2AuthenticationFailureHandler;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.web.filter.CorsFilter;

import java.time.Duration;


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
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

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
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .httpBasic(httpBasic -> httpBasic.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // 모든 OPTIONS 허용 (CORS용)
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // 웹알림
                        .requestMatchers("/notify-ws/**").permitAll()
                        // 마이 페이지 수정
                        .requestMatchers("/mypage/profile/**").authenticated()
                        .requestMatchers("/mypage/account").authenticated()

                        // /api/** 전체 허용 (이 한 줄로 다 처리됨)
                        .requestMatchers("/api/**").permitAll()

                        .requestMatchers("/battle/**").permitAll()

                        // 정적 자원 허용
                        .requestMatchers("/images/**", "/static/**").permitAll()

                        // 명시적 설정: /api/secured/** 경로는 JWT 인증된 사용자만 접근 허용
                        .requestMatchers("/api/secured/**").authenticated()

                        //  PVE 관련: 맵 조회는 비로그인도 허용
                        .requestMatchers("/api/pve/maps").permitAll()
                        
                        // 회원탈퇴
                        .requestMatchers("/api/user/withdraw").authenticated()

                        // 나머지 모든 요청은 인증된 사용자에게만 허용
                        .anyRequest().authenticated()
                )
                .oauth2Login(oauth2 -> oauth2
                        .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
                        .successHandler(oAuth2AuthenticationSuccessHandler)
                        .failureHandler(oAuth2AuthenticationFailureHandler)
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((req, res, e) -> {
                            res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            res.setContentType("application/json;charset=UTF-8");
                            res.getWriter().write("{\"message\":\"unauthorized\"}");
                        })
                )
                .addFilterBefore(new JwtAuthenticationFilter(jwtTokenProvider), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

}
