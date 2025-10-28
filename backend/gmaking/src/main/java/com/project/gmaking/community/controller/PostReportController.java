package com.project.gmaking.community.controller;

import com.project.gmaking.community.service.PostReportService;
import com.project.gmaking.community.vo.PostReportRequestDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/community")
@RequiredArgsConstructor
public class PostReportController {

    private final PostReportService postReportService;

    @PostMapping("/posts/{postId}/report")
    public ResponseEntity<Void> reportPost(
            @PathVariable("postId") Long postId,
            @Valid @RequestBody PostReportRequestDTO requestDTO,
            @AuthenticationPrincipal String userId   // String 그대로
    ) {
        if (userId == null) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }

        try {
            // String reporterId 그대로 전달
            postReportService.createReport("POST", postId, userId, requestDTO);
            return new ResponseEntity<>(HttpStatus.CREATED);
        } catch (IllegalStateException e) {
            // 중복 신고
            return new ResponseEntity<>(HttpStatus.CONFLICT);
        } catch (Exception e) {
            // 기타 서버 오류
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/comments/{commentId}/report")
    public ResponseEntity<Void> reportComment(
            @PathVariable("commentId") Long commentId,
            @Valid @RequestBody PostReportRequestDTO requestDTO,
            @AuthenticationPrincipal String userId
    ) {
        if (userId == null) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }

        try {
            postReportService.createReport("COMMENT", commentId, userId, requestDTO);
            return new ResponseEntity<>(HttpStatus.CREATED);
        } catch (IllegalStateException e) {
            return new ResponseEntity<>(HttpStatus.CONFLICT);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}