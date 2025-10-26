package com.project.gmaking.community.controller;

import com.project.gmaking.community.service.PostCommentService;
import com.project.gmaking.community.vo.PostCommentRequestVO;
import com.project.gmaking.community.vo.PostCommentResponseVO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal; // 👈 추가
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/community/{postId}/comments")
@RequiredArgsConstructor
public class PostCommentController {

    private final PostCommentService commentService;

    /**
     * POST /community/{postId}/comments
     * 댓글 등록 API
     * (인증 필요: SecurityConfig에서 authenticated() 설정됨)
     */
    @PostMapping
    public ResponseEntity<String> registerComment( // 반환 타입을 String으로 변경하여 에러 메시지를 담을 수 있게 함
                                                   @PathVariable Long postId,
                                                   @Valid @RequestBody PostCommentRequestVO requestVO,
                                                   @AuthenticationPrincipal String userId) { // 👈 String userId 주입

        // PostController와 동일하게 userId 널 체크
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("유효한 사용자 정보가 없습니다. 다시 로그인해 주세요.");
        }

        try {
            // 1. Service 메서드 호출 시, 변경된 시그니처 사용
            commentService.registerComment(postId, userId, requestVO);

            return new ResponseEntity<>("댓글 등록 성공", HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            System.err.println("댓글 등록 중 오류 발생: " + e.getMessage());
            return new ResponseEntity<>("댓글 등록 실패: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * GET /community/{postId}/comments
     * 댓글 목록 조회 API
     * (비인증 허용: SecurityConfig에서 permitAll() 설정 필요)
     */
    @GetMapping
    public ResponseEntity<List<PostCommentResponseVO>> getCommentList(
            @PathVariable Long postId) {

        try {
            List<PostCommentResponseVO> comments = commentService.getCommentList(postId);
            return ResponseEntity.ok(comments); // 200 OK
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            System.err.println("댓글 목록 조회 중 오류 발생: " + e.getMessage());
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * DELETE /community/{postId}/comments/{commentId}
     * 댓글 삭제 API (논리적 삭제)
     * (인증 필요: SecurityConfig에서 authenticated() 설정됨)
     */
    @DeleteMapping("/{commentId}")
    public ResponseEntity<String> deleteComment( // 반환 타입을 String으로 변경
                                                 @PathVariable Long postId,
                                                 @PathVariable Long commentId,
                                                 @AuthenticationPrincipal String userId) { // 👈 String userId 주입

        // PostController와 동일하게 userId 널 체크
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("유효한 사용자 정보가 없습니다. 다시 로그인해 주세요.");
        }

        try {
            commentService.deleteComment(commentId, userId);
            return new ResponseEntity<>("댓글 삭제 성공", HttpStatus.NO_CONTENT); // 204 No Content
        } catch (SecurityException e) {
            // 권한 없음 예외 (예: 다른 사용자 댓글 삭제 시도)
            return new ResponseEntity<>("삭제 권한이 없습니다.", HttpStatus.FORBIDDEN); // 403 Forbidden
        } catch (RuntimeException e) {
            // 댓글을 찾을 수 없거나 삭제 처리 중 오류
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND); // 404 Not Found 또는 다른 적절한 에러
        } catch (Exception e) {
            System.err.println("댓글 삭제 중 오류 발생: " + e.getMessage());
            return new ResponseEntity<>("댓글 삭제 실패", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * PUT /community/{postId}/comments/{commentId}
     * 댓글 수정 API
     * (인증 필요: SecurityConfig에서 authenticated() 설정됨)
     */
    @PutMapping("/{commentId}") // 👈 댓글 수정 API 추가!
    public ResponseEntity<String> updateComment(
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @Valid @RequestBody PostCommentRequestVO requestVO,
            @AuthenticationPrincipal String userId) {

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("유효한 사용자 정보가 없습니다. 다시 로그인해 주세요.");
        }

        try {
            // 1. Service 메서드 호출
            commentService.updateComment(commentId, userId, requestVO); // postId는 필요 없을 수 있습니다. Service 시그니처 확인 필요.

            return new ResponseEntity<>("댓글 수정 성공", HttpStatus.OK); // 200 OK
        } catch (SecurityException e) {
            // 권한 없음 예외 (예: 다른 사용자 댓글 수정 시도)
            return new ResponseEntity<>("수정 권한이 없거나 댓글 작성자가 아닙니다.", HttpStatus.FORBIDDEN); // 403 Forbidden
        } catch (IllegalArgumentException e) {
            // 댓글을 찾을 수 없거나 내용이 비어있는 경우
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            System.err.println("댓글 수정 중 오류 발생: " + e.getMessage());
            return new ResponseEntity<>("댓글 수정 실패: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}