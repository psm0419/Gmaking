package com.project.gmaking.character.controller;

import com.project.gmaking.character.service.CharacterService;
import com.project.gmaking.character.service.CharacterServiceGpt;
import com.project.gmaking.character.vo.CharacterGenerateRequestVO;
import com.project.gmaking.character.vo.CharacterGenerateResponseVO;
import com.project.gmaking.character.vo.CharacterVO;
import com.project.gmaking.security.JwtTokenProvider;
import io.jsonwebtoken.JwtException;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/character")
@RequiredArgsConstructor
public class CharacterController {

    private final CharacterService characterService;
    private final CharacterServiceGpt characterServicegpt;
    private final JwtTokenProvider tokenProvider;

    private static final String BEARER_PREFIX = "Bearer ";

    // GET /api/character/list?userId=xxxx
    @GetMapping("/list")
    public ResponseEntity<List<CharacterVO>> getCharacterList(@RequestParam String userId) {
        List<CharacterVO> list = characterService.getCharactersByUser(userId);
        return ResponseEntity.ok(list);
    }

    // ---------------------------------------------------------------------------------

    /**
     * 캐릭터 생성 요청을 처리하는 메인 엔드포인트
     */
    @PostMapping("/create")
    public Mono<ResponseEntity<CharacterGenerateResponseVO>> generateCharacter(
            @RequestPart("image") MultipartFile image,
            @RequestParam(value = "userPrompt", required = false) String userPrompt,
            @RequestParam("characterName") String characterName,
            @RequestHeader("Authorization") String token) {

        String userId;
        try {
            // 1. 토큰에서 "Bearer " 접두사 제거
            String jwt = resolveToken(token);

            // 토큰 유효성 검사 및 userId 추출
            if (jwt == null || !tokenProvider.validateToken(jwt)) {
                // 토큰이 없거나 유효하지 않으면 401 Unauthorized 응답
                return Mono.just(ResponseEntity.status(401).body(null));
            }

            userId = tokenProvider.getUserIdFromToken(jwt);

        } catch (JwtException e) {
            // 토큰 파싱 오류 (변조 등) 시 401 Unauthorized
            System.err.println("JWT Parsing Error: " + e.getMessage());
            return Mono.just(ResponseEntity.status(401).body(null));
        }

        CharacterGenerateRequestVO requestVO = new CharacterGenerateRequestVO();
        requestVO.setImage(image);
        requestVO.setUserPrompt(userPrompt);
        requestVO.setCharacterName(characterName);

        try {
            // 3. 서비스 로직 실행
            return characterServicegpt.generateCharacter(requestVO, userId)
                    .map(response -> ResponseEntity.ok(response))
                    .onErrorResume(e -> {
                        System.err.println("캐릭터 생성 중 런타임 오류 발생: " + e.getMessage());

                        // GPT/DALL-E API 오류일 경우, 403 Forbidden을 받은 것으로 가정
                        if (e.getMessage() != null && e.getMessage().contains("403 Forbidden")) {
                            // 클라이언트에게 403 Forbidden을 반환하여, API 키 문제나 정책 문제임을 알림
                            return Mono.just(ResponseEntity.status(403).build());
                        }

                        // 그 외 런타임 오류 (이미지 분류 실패 등)는 400 Bad Request 반환
                        return Mono.just(ResponseEntity.badRequest().build());
                    });
        } catch (IOException e) {
            // 파일 처리 중 오류 시 500 Internal Server Error
            System.err.println("캐릭터 생성 요청 중 IO 오류 발생: " + e.getMessage());
            return Mono.just(ResponseEntity.internalServerError().build());
        }
    }

    /**
     * Authorization 헤더에서 JWT 토큰 문자열만 추출하는 헬퍼 메소드
     */
    private String resolveToken(String bearerToken) {
        if (bearerToken != null && bearerToken.startsWith(BEARER_PREFIX)) {
            return bearerToken.substring(BEARER_PREFIX.length());
        }
        return null;
    }

    // ---------------------------------------------------------------------------------

}