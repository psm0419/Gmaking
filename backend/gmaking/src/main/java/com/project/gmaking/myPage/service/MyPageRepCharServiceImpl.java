package com.project.gmaking.myPage.service;

import com.project.gmaking.myPage.dao.MyPageRepCharDAO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class MyPageRepCharServiceImpl implements MyPageRepCharService {

    private final MyPageRepCharDAO dao;

    @Override
    public Integer getMyRepresentativeCharId(String userId) {
        return dao.selectRepresentativeCharacterId(userId);
    }

    @Override
    public void setMyRepresentativeChar(String userId, Integer characterId) {
        if (characterId == null) throw new IllegalArgumentException("characterId가 필요합니다.");
        int updated = dao.updateRepresentativeCharacter(userId, characterId);
        if (updated == 0) throw new IllegalStateException("대표 캐릭터 설정 실패(소유권 확인).");
    }

    @Override
    public void clearMyRepresentativeChar(String userId) {
        dao.clearRepresentativeCharacter(userId);
    }
}
