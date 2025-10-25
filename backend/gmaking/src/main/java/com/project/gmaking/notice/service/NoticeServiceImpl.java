package com.project.gmaking.notice.service;

import com.project.gmaking.notice.dao.NoticeDAO;
import com.project.gmaking.notice.vo.NoticeVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NoticeServiceImpl implements NoticeService {

    private final NoticeDAO noticeDAO;

    @Override
    public Map<String, Object> getNoticeList(int page, int size) {
        int totalCount = noticeDAO.selectNoticeCount();
        int offset = (page - 1) * size;

        List<NoticeVO> noticeList = noticeDAO.selectNoticeList(offset, size);

        Map<String, Object> result = new HashMap<>();
        result.put("totalCount", totalCount);
        result.put("currentPage", page);
        result.put("pageSize", size);
        result.put("noticeList", noticeList);

        return result;
    }

    @Override
    @Transactional
    public NoticeVO getNoticeDetail(int noticeId) {
        // 1. 조회수 증가
        noticeDAO.incrementViewCount(noticeId);

        // 2. 상세 정보 조회
        return noticeDAO.selectNoticeById(noticeId);
    }

    @Override
    @Transactional
    public int createNotice(NoticeVO noticeVO) {
        return noticeDAO.insertNotice(noticeVO);
    }

    @Override
    @Transactional
    public int updateNotice(NoticeVO noticeVO) {
        return noticeDAO.updateNotice(noticeVO);
    }

    @Override
    public int deleteNotice(int noticeId) {
        return noticeDAO.deleteNotice(noticeId);
    }

}