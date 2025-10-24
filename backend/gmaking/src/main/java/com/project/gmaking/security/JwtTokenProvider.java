package com.project.gmaking.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.*;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.spec.SecretKeySpec;
import java.security.Key;
import java.util.Date;
import java.util.Base64;

/**
 * JWT 토큰 생성, 유효성 검증 등을 담당하는 유틸리티 클래스
 */
@Component
public class JwtTokenProvider {

    private final String secret;
    private final long tokenValidityInMilliseconds;
    private Key key;

    public JwtTokenProvider(
            @Value("${jwt.secret-key}") String secret,
            @Value("${jwt.token-validity-in-seconds}") long tokenValidityInSeconds) {
        this.secret = secret;
        this.tokenValidityInMilliseconds = tokenValidityInSeconds * 1000;
    }

    // 시크릿 키를 Base64 디코딩하여 Key 객체로 변환
    @PostConstruct
    public void init() {
        byte[] keyBytes = Base64.getDecoder().decode(secret);
        this.key = new SecretKeySpec(keyBytes, SignatureAlgorithm.HS512.getJcaName());
    }

    /**
     * 로그인 성공 시 JWT 토큰 생성
     * @param userId 사용자 ID
     * @param role 사용자 역할 (ROLE)
     * @param userNickname 사용자 닉네임
     * @param hasCharacter 캐릭터 생성 여부
     * @param characterImageUrl 캐릭터 이미지 URL
     * @param incubatorCount 부화권수
     * @param isAdFree 광고 패스권
     * @return JWT 문자열
     */
    public String createToken(String userId, String role, String userNickname, boolean hasCharacter, String characterImageUrl, Integer incubatorCount, boolean isAdFree, Integer characterCount) {
        long now = (new Date()).getTime();

        Date validity = new Date(now + this.tokenValidityInMilliseconds);

        return Jwts.builder()
                .setSubject(userId)
                .claim("role", role)
                .claim("userId", userId)
                .claim("userNickname", userNickname)
                .claim("hasCharacter", hasCharacter)
                .claim("characterImageUrl", characterImageUrl)
                .claim("incubatorCount", incubatorCount)
                .claim("isAdFree", isAdFree)
                .signWith(SignatureAlgorithm.HS512, key)
                .claim("characterCount", characterCount)
                .setExpiration(validity)
                .compact();
    }

    /**
     * 토큰에서 사용자 ID 추출
     * @param token JWT 문자열
     * @return 사용자 ID
     */
    public String getUserIdFromToken(String token) {
        return Jwts.parser()
                .setSigningKey(key)
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    /**
     * 토큰에서 사용자 역할(Role) 추출
     * @param token JWT 문자열
     * @return 사용자 역할
     */
    public String getRoleFromToken(String token) {
        return Jwts.parser()
                .setSigningKey(key)
                .parseClaimsJws(token)
                .getBody()
                .get("role", String.class);
    }

    /**
     * 토큰의 유효성 검증
     * @param token 검증할 JWT
     * @return 유효하면 true
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser().setSigningKey(key).parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            System.err.println("JWT Validation Error: " + e.getMessage());
        }
        return false;
    }

}
