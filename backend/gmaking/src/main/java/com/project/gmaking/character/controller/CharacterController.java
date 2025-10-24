package com.project.gmaking.character.controller;

import com.project.gmaking.character.service.CharacterService;
import com.project.gmaking.character.service.CharacterServiceGpt;
import com.project.gmaking.character.service.CharacterStartService;
import com.project.gmaking.character.vo.CharacterGenerateRequestVO;
import com.project.gmaking.character.vo.CharacterGenerateResponseVO;
import com.project.gmaking.character.vo.CharacterVO;
import com.project.gmaking.security.JwtTokenProvider;
import io.jsonwebtoken.JwtException;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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
    private final CharacterStartService characterStartService;

    private static final String BEARER_PREFIX = "Bearer ";

    // GET /api/character/list?userId=xxxx
    @GetMapping("/list")
    public ResponseEntity<List<CharacterVO>> getCharacterList(@RequestParam String userId) {
        List<CharacterVO> list = characterService.getCharactersByUser(userId);
        return ResponseEntity.ok(list);
    }

    // ---------------------------------------------------------------------------------

    /**
     * 0단계: 캐릭터 생성 시작 및 부화권 차감 API (DB 저장 X, 새 토큰 반환)
     * POST /api/character/start-generation
     */
    @PostMapping("/start-generation")
    public ResponseEntity<CharacterGenerateResponseVO> startCharacterGeneration(
            @RequestHeader(name = HttpHeaders.AUTHORIZATION) String authHeader) {

        String userId;
        try {
            String token = resolveToken(authHeader);
            if (token == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            userId = tokenProvider.getUserIdFromToken(token);
        } catch (JwtException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            // 부화권 차감 및 새 토큰이 포함된 응답 VO 반환
            CharacterGenerateResponseVO response = characterStartService.startCharacterGeneration(userId);

            // 새 토큰을 포함한 응답 반환 (200 OK)
            return ResponseEntity.ok(response);

        } catch (IllegalStateException e) {
            // 부화권 부족, DB 오류 등
            System.err.println("캐릭터 생성 시작 비즈니스 오류: " + e.getMessage());
            return ResponseEntity.badRequest().body(CharacterGenerateResponseVO.builder()
                    .errorMessage(e.getMessage())
                    .build());
        } catch (Exception e) {
            System.err.println("캐릭터 생성 시작 중 오류 발생: " + e.getMessage());
            return ResponseEntity.internalServerError().body(CharacterGenerateResponseVO.builder()
                    .errorMessage("서버 내부 오류가 발생했습니다.")
                    .build());
        }
    }

    /**
     * 1단계: 미리보기 생성/재생성 API (DB 저장 X)
     * POST /api/character/generate
     */
    @PostMapping(value = "/generate", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Mono<ResponseEntity<CharacterGenerateResponseVO>> generateCharacterPreview(
            @RequestPart("image") MultipartFile image,
            @RequestPart("characterName") String characterName,
            @RequestPart(value = "userPrompt", required = false) String userPrompt,
            @RequestHeader(name = HttpHeaders.AUTHORIZATION) String authHeader) {

        String userId;
        try {
            String token = resolveToken(authHeader);
            if (token == null) {
                return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
            }
            userId = tokenProvider.getUserIdFromToken(token);
        } catch (JwtException e) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        CharacterGenerateRequestVO requestVO = new CharacterGenerateRequestVO();
        requestVO.setImage(image);
        requestVO.setCharacterName(characterName);
        requestVO.setUserPrompt(userPrompt);

        try {
            return characterServicegpt.generateCharacterPreview(requestVO, userId)
                    .map(response -> ResponseEntity.ok(response))
                    .onErrorResume(e -> {
                        System.err.println("캐릭터 생성 미리보기 중 런타임 오류 발생: " + e.getMessage());
                        return Mono.error(e);
                    });
        } catch (IOException e) { // generateCharacterPreview가 던지는 IOException 처리
            System.err.println("캐릭터 생성 요청 중 IO 오류 발생: " + e.getMessage());
            return Mono.just(ResponseEntity.internalServerError().build());
        }

    }

    /**
     * 2단계: 최종 확정 API (DB 저장 O, 새 토큰 반환)
     * POST /api/character/finalize
     */
    @PostMapping("/finalize")
    public ResponseEntity<CharacterGenerateResponseVO> finalizeCharacter(
            @RequestBody CharacterGenerateResponseVO finalData, // 최종 이미지 URL, predictedAnimal, characterName 포함
            @RequestHeader(name = HttpHeaders.AUTHORIZATION) String authHeader) {

        String userId;

        try {
            String token = resolveToken(authHeader);
            if (token == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            userId = tokenProvider.getUserIdFromToken(token);
        } catch (JwtException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            // DB 저장 및 새 토큰이 포함된 최종 응답 VO 반환
            CharacterGenerateResponseVO finalResponse = characterServicegpt.finalizeCharacter(finalData, userId);

            // 새 토큰을 포함한 최종 응답 반환
            return ResponseEntity.ok(finalResponse);

        } catch (IllegalStateException e) {
            System.err.println("캐릭터 최종 확정 비즈니스 오류: " + e.getMessage());
            return ResponseEntity.badRequest().body(CharacterGenerateResponseVO.builder()
                    .characterName(finalData.getCharacterName())
                    .imageUrl(finalData.getImageUrl())
                    .predictedAnimal(finalData.getPredictedAnimal())
                    .errorMessage(e.getMessage())
                    .build());
        } catch (Exception e) {
            System.err.println("캐릭터 최종 확정 중 오류 발생: " + e.getMessage());

            return ResponseEntity.internalServerError().body(CharacterGenerateResponseVO.builder()
                    .characterName(finalData.getCharacterName())
                    .imageUrl(finalData.getImageUrl())
                    .predictedAnimal(finalData.getPredictedAnimal())
                    .newToken(null)
                    .build());
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
}