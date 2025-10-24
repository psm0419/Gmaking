package com.project.gmaking.community.controller;

import com.project.gmaking.community.service.PostReportService;
import com.project.gmaking.community.vo.PostReportRequestDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/community")
public class PostReportController {
    private final PostReportService postReportService;

    @Autowired
    public PostReportController(PostReportService postReportService){
        this.postReportService = postReportService;
    }

    // 게시글 신고를 접수
    @PostMapping("/posts/{postId}/report")
    public ResponseEntity<Void> reportPost(
            @PathVariable("postId") Long postId,
            @Valid @RequestBody PostReportRequestDTO requestDTO,
            @RequestHeader(name = "Authorization", required = false) String authorizationHeader
    ) {
        // 임시로 하드코딩된 신고자 ID (로그인된 사용자 ID라고 가정)
        Long reporterId = 1L;

        // 2. [검증] 로그인 여부 체크
        if (reporterId == null) {
            // 토큰이 유효하지 않거나 사용자가 없는 경우
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }

        // 3. [비즈니스 로직 호출] Service 계층으로 요청 전달
        try {
            postReportService.createReport("POST", postId, reporterId, requestDTO);
        } catch (IllegalStateException e) {
            // Service에서 던진 중복 신고 등의 비즈니스 예외 처리 (409 Conflict)
            // (e.g., "이미 처리 대기 중인 신고 기록이 있습니다.")
            System.err.println("신고 처리 오류: " + e.getMessage());
            return new ResponseEntity<>(HttpStatus.CONFLICT);
        } catch (Exception e) {
            // 그 외 서버 오류
            System.err.println("서버 오류: " + e.getMessage());
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }

        // 4. [응답] 성공 시 201 Created 반환
        return new ResponseEntity<>(HttpStatus.CREATED);
    }

    /**
     * 댓글 신고 접수 엔드포인트
     */
    @PostMapping("/comments/{commentId}/report")
    public ResponseEntity<Void> reportComment(
            @PathVariable("commentId") Long commentId,
            @Valid @RequestBody PostReportRequestDTO requestDTO,
            @RequestHeader(name = "Authorization", required = false) String authorizationHeader
    ) {
        Long reporterId = 1L; // 실제 로그인 로직으로 대체 필요
        if (reporterId == null) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }

        try {
            // **Service 호출:** targetType을 "COMMENT"로 명시하고, targetId에 commentId 전달
            postReportService.createReport("COMMENT", commentId, reporterId, requestDTO);
        } catch (IllegalStateException e) {
            System.err.println("댓글 신고 처리 오류: " + e.getMessage());
            return new ResponseEntity<>(HttpStatus.CONFLICT);
        } catch (Exception e) {
            System.err.println("댓글 신고 서버 오류: " + e.getMessage());
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }

        return new ResponseEntity<>(HttpStatus.CREATED);
    }
}