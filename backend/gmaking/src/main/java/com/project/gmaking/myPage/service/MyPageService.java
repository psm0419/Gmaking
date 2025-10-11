package com.project.gmaking.myPage.service;

import com.project.gmaking.myPage.vo.CharacterCardVO;
import com.project.gmaking.myPage.vo.MyPageProfileVO;

import java.util.List;

public interface MyPageService {
//    프로필 단건 조회
    MyPageProfileVO getProfile(String userId);

//    캐릭터 목록 (페이징)
    List<CharacterCardVO> getCharacters(String userId, int page, int size);

//    캐릭터 총 개수
    int getCharacterCount(String userId);
}
