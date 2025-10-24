package com.project.gmaking.character.service;

import com.project.gmaking.character.vo.CharacterGenerateResponseVO;
import com.project.gmaking.login.dao.LoginDAO;
import com.project.gmaking.login.vo.LoginVO;
import com.project.gmaking.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CharacterStartServiceImpl implements CharacterStartService {

    private static final Logger logger = LoggerFactory.getLogger(CharacterStartServiceImpl.class);
    private final LoginDAO loginDAO;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * 캐릭터 생성 시작 시 부화권을 차감하고 새 토큰을 발급
     */
    @Override
    @Transactional
    public CharacterGenerateResponseVO startCharacterGeneration(String userId) {

        LoginVO userBeforeUpdate = loginDAO.selectUserById(userId);

        Integer incubatorCount = userBeforeUpdate.getIncubatorCount();

        // 1. 부화권 수량 확인
        if (incubatorCount == null || incubatorCount <= 0) {
            logger.warn("캐릭터 생성 시작 실패: 부화권 수량 부족(User: {})", userId);
            throw new IllegalStateException("부화권 수량이 부족합니다. 상점에서 부화권을 구매해주세요");
        }

        // 2. 부화권 차감
        int updatedRows = loginDAO.decrementIncubatorCount(userId);

        if (updatedRows == 0) {
            logger.error("캐릭터 생성 시작 실패: 부화권 차감 DB 오류 (User: {})", userId);
            throw new IllegalStateException("부화권 차감 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
        }

        // 3. 사용자 정보 업데이트 및 새 토큰 생성
        LoginVO currentUser = loginDAO.selectUserById(userId);

        String newToken = jwtTokenProvider.createToken(
                currentUser.getUserId(),
                currentUser.getRole(),
                currentUser.getUserNickname(),
                currentUser.isHasCharacter(),
                currentUser.getCharacterImageUrl(),
                currentUser.getIncubatorCount(),
                currentUser.isAdFree(),
                currentUser.getCharacterCount()
        );

        return CharacterGenerateResponseVO.builder()
                .newToken(newToken)
                .build();
    }
}