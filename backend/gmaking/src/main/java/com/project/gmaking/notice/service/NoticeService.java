package com.project.gmaking.notice.service;

import com.project.gmaking.notice.vo.NoticeVO;
import java.util.Map;

public interface NoticeService {

    // 목록 조회 (페이지네이션 정보 포함)
    Map<String, Object> getNoticeList(int page, int size);

    // 상세 조회 (조회수 증가 포함)
    NoticeVO getNoticeDetail(int noticeId);

    // 공지 등록 (관리자)
    int createNotice(NoticeVO noticeVO);

    // 공지 수정 (관리자)
    int updateNotice(NoticeVO noticeVO);

    // 공지 삭제 (관리자)
    int deleteNotice(int noticeId);

}