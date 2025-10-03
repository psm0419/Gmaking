package com.project.gmaking.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * 전역 CORS 설정을 위한 클래스입니다.
 * React 개발 서버(localhost:3000)와의 통신을 허용합니다.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**") // 모든 API 경로에 대해
                // React 개발 서버 주소를 허용 오리진으로 설정
                .allowedOrigins("http://localhost:3000")
                // 필요한 HTTP 메서드 허용
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                // 인증 정보 (쿠키, HTTP 인증)를 요청에 포함할 수 있도록 허용
                .allowCredentials(true)
                // 응답 헤더에 노출할 수 있는 사용자 정의 헤더 지정
                .exposedHeaders("Authorization")
                // Pre-flight 요청 캐시 시간 설정
                .maxAge(3600);
    }
}

