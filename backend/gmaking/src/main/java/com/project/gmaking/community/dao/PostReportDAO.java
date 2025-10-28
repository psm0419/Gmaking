package com.project.gmaking.community.dao;

import com.project.gmaking.community.vo.PostReportVO;

public interface PostReportDAO {
    // 신고 정보 저장 (INSERT)
    void insertReport(PostReportVO postReportVO);

    // 중복 신고 확인 (SELECT)
    int checkDuplicateReport(Long targetId, String targetType, String reporterId);
}
