package com.project.gmaking.myPage.service;

public interface MyPageRepCharService {
    Integer getMyRepresentativeCharId(String userId);
    void setMyRepresentativeChar(String userId, Integer characterId);
    void clearMyRepresentativeChar(String userId);
}
