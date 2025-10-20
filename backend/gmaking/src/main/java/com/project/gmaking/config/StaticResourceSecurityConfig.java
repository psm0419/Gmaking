//package com.project.gmaking.config;
//
//import org.springframework.context.annotation.Bean;
//import org.springframework.context.annotation.Configuration;
//import org.springframework.core.annotation.Order;
//import org.springframework.security.config.annotation.web.builders.HttpSecurity;
//import org.springframework.security.web.SecurityFilterChain;
//
//@Configuration
//public class StaticResourceSecurityConfig {
//    @Bean
//    @Order(0)
//    SecurityFilterChain staticChain(HttpSecurity http) throws Exception {
//        http
//                .securityMatcher("/images/**", "/static/**", "/assets/**", "/favicon.ico")
//                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
//                .csrf(csrf -> csrf.disable())
//                .headers(h -> h.cacheControl(c -> {})) // 필요시
//                .requestCache(c -> c.disable())
//                .securityContext(c -> c.disable())
//                .sessionManagement(c -> c.disable());
//        return http.build();
//    }
//}
