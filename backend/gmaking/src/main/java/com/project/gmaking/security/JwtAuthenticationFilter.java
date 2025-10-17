package com.project.gmaking.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import lombok.extern.slf4j.Slf4j;

/**
 * 모든 요청에 대해 JWT 토큰을 검증하고 인증 정보를 SecurityContext에 저장하는 필터
 */
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final String AUTHORIZATION_HEADER = "Authorization";
    private final String BEARER_PREFIX = "Bearer ";

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getRequestURI();
        String method = request.getMethod();

        return method.equalsIgnoreCase("GET") &&
                path.startsWith("/community");
    }


    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }
        // Request Header에서 토큰 추출
        String jwt = resolveToken(request);

        if (jwt == null) {
            System.out.println("[SEC] " + request.getMethod() + " " + request.getRequestURI() + " Authorization=null");
        } else {
            System.out.println("[SEC] " + request.getMethod() + " " + request.getRequestURI()
                    + " resolved jwt=" + jwt.substring(0, Math.min(12, jwt.length())) + "...");
        }

        // 토큰 유효성 검증
        if (jwt != null && tokenProvider.validateToken(jwt)) {

            // 토큰에서 사용자 정보(ID, Role) 추출
            String userId = tokenProvider.getUserIdFromToken(jwt);
            String role = tokenProvider.getRoleFromToken(jwt);

            // 인증 정보 생성 및 SecurityContext에 저장
            // 여기서는 UserDetails 대신 권한 정보만 담은 간단한 인증 객체를 사용
            SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + role.toUpperCase());

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(userId, null, Collections.singletonList(authority));

            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }

    // HTTP 요청 헤더에서 JWT 토큰을 추출
    private String resolveToken(HttpServletRequest request) {

        String bearerToken = request.getHeader(AUTHORIZATION_HEADER);

        if (bearerToken != null && bearerToken.startsWith(BEARER_PREFIX)) {
            return bearerToken.substring(BEARER_PREFIX.length());
        }

        return null;
    }
}