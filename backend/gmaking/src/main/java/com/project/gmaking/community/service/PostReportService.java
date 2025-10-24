package com.project.gmaking.community.service;

import com.project.gmaking.community.dao.PostReportDAO;
import com.project.gmaking.community.vo.PostReportRequestDTO;
import com.project.gmaking.community.vo.PostReportVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class PostReportService {
    private final PostReportDAO postReportDAO;

    @Autowired
    public PostReportService(PostReportDAO postReportDAO){
        this.postReportDAO = postReportDAO;
    }

    // 게시글 신고 접수
    @Transactional
    public void createReport (String targetType, Long targetId, Long reporterId, PostReportRequestDTO requestDTO) {
        // 1. [비즈니스 검증] 중복 신고 확인
        // targetId와 targetType을 모두 사용하여 중복을 확인합니다.
        int existingCount = postReportDAO.checkDuplicateReport(targetId, targetType, reporterId);

        if (existingCount > 0) {
            throw new IllegalStateException("이미 처리 대기 중인 신고 기록이 있습니다. 중복 신고는 불가능합니다.");
        }

        // 2. [데이터 처리] 요청 DTO에서 사유 파싱 (Service에서 처리하는 것이 일반적)
        String fullReason = requestDTO.getReason();
        String reasonCode;
        String reasonDetail = null;

        // 예: "SPAM: 상세 내용" -> SPAM을 코드로, 나머지를 상세 내용으로 분리
        if (fullReason != null && fullReason.contains(":")) {
            String[] parts = fullReason.split(":", 2);
            reasonCode = parts[0].trim();
            if (parts.length > 1) {
                reasonDetail = parts[1].trim();
            }
        } else {
            // 상세 내용 없이 코드만 온 경우
            reasonCode = fullReason != null ? fullReason.trim() : "UNKNOWN";
        }

        // 3. [데이터 매핑] ReportVO 객체 생성 및 초기화
        PostReportVO reportVO = new PostReportVO();
        reportVO.setTargetType(targetType); // 게시글 신고이므로 하드코딩
        reportVO.setTargetId(targetId);
        reportVO.setReporterId(reporterId);
        reportVO.setReasonCode(reasonCode);
        reportVO.setReasonDetail(reasonDetail);
        reportVO.setStatus("PENDING");

        // 4. [감사 필드] 생성자/생성일시 설정
        reportVO.setCreatedBy(reporterId); // 신고자가 생성자
        reportVO.setCreatedDate(LocalDateTime.now()); // DB NOW()를 사용해도 되지만, Service에서 설정

        // 5. [DAO 호출] DB에 신고 기록 저장
        postReportDAO.insertReport(reportVO);
    }
}