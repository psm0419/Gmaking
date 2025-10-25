package com.project.gmaking.notice.controller;

import com.project.gmaking.notice.service.NoticeService;
import com.project.gmaking.notice.vo.NoticeVO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notices")
@RequiredArgsConstructor
public class NoticeController {

    private final NoticeService noticeService;

    /**
     * [ALL] 공지사항 목록 조회 (최신순, 페이지네이션)
     * GET /api/notices?page=1&size=10
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getNoticeList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {

        Map<String, Object> result = noticeService.getNoticeList(page, size);
        return ResponseEntity.ok(result);
    }

    /**
     * [ALL] 공지사항 상세 조회 (조회수 증가)
     * GET /api/notices/{noticeId}
     */
    @GetMapping("/{noticeId}")
    public ResponseEntity<NoticeVO> getNoticeDetail(@PathVariable int noticeId) {
        NoticeVO notice = noticeService.getNoticeDetail(noticeId);
        if (notice == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(notice);
    }

    /**
     * [ADMIN] 공지사항 등록
     * POST /api/notices
     */
    @PostMapping
    public ResponseEntity<Void> createNotice(@RequestBody NoticeVO noticeVO) {
        String adminUserId = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        noticeVO.setCreatedBy(adminUserId);

        noticeService.createNotice(noticeVO);
        return ResponseEntity.ok().build();
    }

    /**
     * [ADMIN] 공지사항 수정
     * PUT /api/notices/{noticeId}
     */
    @PutMapping("/{noticeId}")
    public ResponseEntity<Void> updateNotice(@PathVariable int noticeId, @RequestBody NoticeVO noticeVO) {
        String adminUserId = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        noticeVO.setNoticeId(noticeId);
        noticeVO.setLastModifiedBy(adminUserId);

        int result = noticeService.updateNotice(noticeVO);

        if (result == 0) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok().build();
    }

    /**
     * [ADMIN] 공지사항 삭제
     * DELETE /api/notices/{noticeId}
     */
    @DeleteMapping("/{noticeId}")
    public ResponseEntity<Void> deleteNotice(@PathVariable int noticeId) {
        int result = noticeService.deleteNotice(noticeId);
        if (result == 0) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok().build();
    }

}