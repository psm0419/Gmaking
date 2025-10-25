package com.project.gmaking.notice.dao;

import com.project.gmaking.notice.vo.NoticeVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface NoticeDAO {

    /**
     * 공지사항 전체 개수 조회 (페이지네이션)
     * @return 전체 공지사항 개수
     */
    int selectNoticeCount();

    /**
     * 공지사항 목록 조회 (최신순, 페이지네이션)
     * @param offset 조회 시작 위치
     * @param limit 한 페이지당 개수
     * @return 공지사항 목록
     */
    List<NoticeVO> selectNoticeList(@Param("offset") int offset, @Param("limit") int limit);

    /**
     * 특정 공지사항 상세 조회
     * @param noticeId 공지사항 ID
     * @return 공지사항 상세 정보
     */
    NoticeVO selectNoticeById(int noticeId);

    /**
     * 공지사항 등록 (관리자)
     * @param noticeVO 등록할 공지사항 정보
     * @return 성공한 행의 개수
     */
    int insertNotice(NoticeVO noticeVO);

    /**
     * 공지사항 수정 (관리자)
     * @param noticeVO 수정할 공지사항 정보
     * @return 성공한 행의 개수
     */
    int updateNotice(NoticeVO noticeVO);

    /**
     * 공지사항 삭제 (관리자)
     * @param noticeId 삭제할 공지사항 ID
     * @return 성공한 행의 개수
     */
    int deleteNotice(int noticeId);

    /**
     * 공지사항 조회수 증가
     * @param noticeId 공지사항 ID
     * @return 성공한 행의 개수
     */
    int incrementViewCount(int noticeId);

}