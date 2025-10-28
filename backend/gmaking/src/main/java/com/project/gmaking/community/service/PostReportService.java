package com.project.gmaking.community.service;

import com.project.gmaking.community.dao.PostReportDAO;
import com.project.gmaking.community.vo.PostReportRequestDTO;
import com.project.gmaking.community.vo.PostReportVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor // @Autowired 대신 사용 (더 깔끔)
public class PostReportService {

    private final PostReportDAO postReportDAO;

    /**
     * 신고 접수 공통 메서드 (게시글/댓글 모두 사용)
     *
     * @param targetType  "POST" 또는 "COMMENT"
     * @param targetId    신고 대상 ID
     * @param reporterId  신고자 ID (String)
     * @param requestDTO  신고 사유 DTO
     */
    @Transactional
    public void createReport(String targetType, Long targetId, String reporterId, PostReportRequestDTO requestDTO) {

        // 1. 중복 신고 체크
        if (postReportDAO.checkDuplicateReport(targetId, targetType, reporterId) > 0) {
            throw new IllegalStateException("이미 처리 대기 중인 신고 기록이 있습니다. 중복 신고는 불가능합니다.");
        }

        // 2. reason 파싱: "ETC: 상세내용" → 코드 + 상세
        String fullReason = requestDTO.getReason();
        String reasonCode;
        String reasonDetail = null;

        if (fullReason != null && fullReason.contains(":")) {
            String[] parts = fullReason.split(":", 2);
            reasonCode = parts[0].trim().toUpperCase(); // 대문자 정규화 (SPAM, ETC 등)
            if (parts.length > 1 && !parts[1].trim().isEmpty()) {
                reasonDetail = parts[1].trim();
            }
        } else {
            reasonCode = fullReason != null ? fullReason.trim().toUpperCase() : "UNKNOWN";
        }

        // 3. VO 생성 및 설정
        PostReportVO reportVO = new PostReportVO();
        reportVO.setTargetType(targetType);
        reportVO.setTargetId(targetId);
        reportVO.setReporterId(reporterId);           // String
        reportVO.setReasonCode(reasonCode);
        reportVO.setReasonDetail(reasonDetail);
        reportVO.setStatus("PENDING");
        reportVO.setCreatedBy(reporterId);           // String
        reportVO.setCreatedDate(LocalDateTime.now());

        // 4. DB 저장
        postReportDAO.insertReport(reportVO);
    }
}