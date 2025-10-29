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
    private final LoginDAO loginDAO; //
    private final JwtTokenProvider jwtTokenProvider; //

    /**
     * 캐릭터 생성 시작 시 부화권을 차감하고 새 토큰을 발급
     */
    @Override
    @Transactional
    public CharacterGenerateResponseVO startCharacterGeneration(String userId) {

        LoginVO userBeforeUpdate = loginDAO.selectUserById(userId); //

        Integer incubatorCount = userBeforeUpdate.getIncubatorCount(); //

        // 부화권 수량 확인 (TB_USER 기준)
        if (incubatorCount == null || incubatorCount <= 0) {
            logger.warn("캐릭터 생성 시작 실패: 부화권 수량 부족(User: {})", userId); //
            throw new IllegalStateException("부화권 수량이 부족합니다. 상점에서 부화권을 구매해주세요"); //
        }

        // 부화권 차감 (TB_USER_INVENTORY)
        final int FREE_INCUBATOR_ID = 5; // 무료지급 부화기
        final int REGULAR_INCUBATOR_ID = 4; // 일반 부화기 (유료)
        int inventoryUpdated = 0;

        // 무료 부화기 (ID: 5) 사용 시도
        inventoryUpdated = loginDAO.decrementUserInventoryQuantity(userId, FREE_INCUBATOR_ID);

        if (inventoryUpdated == 0) {
            logger.warn("무료 부화권(ID: 5)이 없습니다. 일반 부화권(ID: 4) 사용을 시도합니다. User ID={}", userId);

            // 일반 부화기 (ID: 4) 사용 시도
            inventoryUpdated = loginDAO.decrementUserInventoryQuantity(userId, REGULAR_INCUBATOR_ID);
        }

        // 2-3. 인벤토리 감소 최종 확인
        if (inventoryUpdated == 0) {
            logger.error("데이터 정합성 오류: TB_USER INCUBATOR_COUNT는 1 이상이나, TB_USER_INVENTORY 감소 실패. User ID={}", userId);
            throw new IllegalStateException("부화권 차감 중 심각한 데이터 오류가 발생했습니다. 고객센터에 문의하세요.");
        }

        // 부화권 차감 (TB_USER)
        // 인벤토리 감소 성공 후, TB_USER의 총 카운트도 감소시켜 동기화
        int userCountUpdated = loginDAO.decrementIncubatorCount(userId);

        if (userCountUpdated == 0) {
            logger.error("데이터 정합성 오류: 인벤토리 감소 성공했으나, TB_USER INCUBATOR_COUNT 감소 실패. User ID={}", userId); //
            throw new IllegalStateException("부화권 차감 중 심각한 데이터 오류가 발생했습니다. 고객센터에 문의하세요."); //
        }

        // 사용자 정보 업데이트 및 새 토큰 생성
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