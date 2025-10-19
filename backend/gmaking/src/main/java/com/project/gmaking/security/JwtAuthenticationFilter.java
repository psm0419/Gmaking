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

/**
 * 모든 요청에 대해 JWT 토큰을 검증하고 인증 정보를 SecurityContext에 저장하는 필터
 */
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final String AUTHORIZATION_HEADER = "Authorization";
    private final String BEARER_PREFIX = "Bearer ";


//    @Override
//    protected boolean shouldNotFilter(HttpServletRequest request) {
//        String uri = request.getRequestURI();
//        // 정적 리소스/루트/파비콘/프리플라이트는 필터 스킵
//        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) return true;
//        return uri.startsWith("/images/")
//                || uri.startsWith("/static/")
//                || uri.startsWith("/css/")
//                || uri.startsWith("/js/")
//                || uri.equals("/")
//                || uri.equals("/index.html")
//                || uri.equals("/favicon.ico");
//    }


    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String uri = request.getRequestURI();

        // 1. 토큰 검사에서 제외할 경로
        if (uri.startsWith("/api/ranking") ||
                uri.startsWith("/api/auth") ||
                uri.startsWith("/api/pve/maps") ||
                uri.startsWith("/images") ||
                uri.startsWith("/static") ||
                "OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        // 2. Authorization 헤더에서 토큰 추출
        String jwt = resolveToken(request);

        if (jwt == null) {
            System.out.println("[SEC] " + request.getMethod() + " " + request.getRequestURI() + " Authorization=null");
        } else {
            System.out.println("[SEC] " + request.getMethod() + " " + request.getRequestURI()
                    + " resolved jwt=" + jwt.substring(0, Math.min(12, jwt.length())) + "...");
        }

        // 3. 토큰 검증
        if (jwt != null && tokenProvider.validateToken(jwt)) {

            // 토큰에서 사용자 정보(ID, Role) 추출
            String userId = tokenProvider.getUserIdFromToken(jwt);
            String role = tokenProvider.getRoleFromToken(jwt);

            // 인증 객체 생성
            SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + role.toUpperCase());
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(userId, null, Collections.singletonList(authority));

            // SecurityContext에 등록
            SecurityContextHolder.getContext().setAuthentication(authentication);
            System.out.println("[SEC] auth set. userId=" + userId + ", role=" + role);
        } else {
            System.out.println("[SEC] token invalid or missing");
            // 인증이 필요한 경로인데 토큰이 유효하지 않으면 401 반환
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        // 4. 다음 필터로 넘김
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