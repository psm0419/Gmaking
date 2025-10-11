package com.project.gmaking.myPage.service;

import com.project.gmaking.myPage.dao.MyPageDAO;
import com.project.gmaking.myPage.vo.CharacterCardVO;
import com.project.gmaking.myPage.vo.MyPageProfileVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MyPageServiceImpl implements MyPageService {
    private final MyPageDAO myPageDAO;

    @Override
    @Transactional(readOnly = true)
    public MyPageProfileVO getProfile(String userId) {
        validateUserId(userId);
        MyPageProfileVO vo = myPageDAO.selectProfile(userId);
        if(vo==null) {
            throw new IllegalArgumentException("사용자를 찾을 수 없습니다 : " + userId);
        }
        return vo;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CharacterCardVO> getCharacters(String userId, int page, int size) {
        validateUserId(userId);
        int limit = Math.max(1, size);
        int offset = Math.max(0, page) * limit;
        return myPageDAO.selectCharacters(userId, limit, offset);
    }

    @Override
    @Transactional(readOnly = true)
    public int getCharacterCount(String userId) {
        validateUserId(userId);
        Integer cnt = myPageDAO.countCharacters(userId);
        return cnt == null ? 0 : cnt;
    }

    private void validateUserId(String userId) {
        if (!StringUtils.hasText(userId)) {
            throw new IllegalArgumentException("userId는 필수입니다.");
        }
    }
}
