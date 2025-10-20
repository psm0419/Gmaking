package com.project.gmaking.community.controller;

import com.project.gmaking.community.service.PostLikeService;
import com.project.gmaking.community.vo.PostLikeDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/community/like")
@RequiredArgsConstructor
public class PostLikeController {

    private final PostLikeService postLikeService;

    // 좋아요 상태 토글
    @PostMapping("/toggle")
    public ResponseEntity<Map<String, Object>> togglePostLike(
            @RequestBody PostLikeDTO postLikeDTO,
            @AuthenticationPrincipal String userId // userId는 String 타입으로 받습니다. (예: "kakao_4493068804")
    ) {
        // 1. 인증 확인 (JWT 필터에서 이미 처리되지만, 안전을 위해 남겨둡니다.)
        if (userId == null || userId.isEmpty()) {
            // 이 경로는 SecurityConfig 설정 덕분에 실제로 도달하지 않을 것입니다.
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED) // 401
                    .body(Map.of("message", "로그인 후 이용할 수 있습니다."));
        }

        try {
            // Service Layer 호출 시, DTO에서 얻은 postId와 Principal에서 얻은 userId(String)를 넘깁니다.
            Map<String, Object> result = postLikeService.togglePostLike(userId, postLikeDTO.getPostId());

            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            System.err.println("좋아요 토글 오류: " + e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "좋아요 처리 중 서버 오류가 발생했습니다."));
        }
    }

    // 좋아요 개수 조회
    @GetMapping("/count/{postId}")
    public ResponseEntity<Integer> getLikeCount(@PathVariable("postId") Long postId) {
        int count = postLikeService.getLikeCount(postId);
        return ResponseEntity.ok(count);
    }
}