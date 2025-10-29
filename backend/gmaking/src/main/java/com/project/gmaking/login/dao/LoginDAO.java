package com.project.gmaking.login.dao;

import com.project.gmaking.login.vo.LoginVO;
import com.project.gmaking.login.vo.RegisterRequestVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface LoginDAO {

    /**
     * 사용자 ID를 기반으로 TB_USER에서 사용자 정보를 조회
     * @param userId 조회할 사용자 ID (TB_USER.USER_ID)
     * @return LoginVO 객체 (사용자 전체 정보)
     */
    LoginVO selectUserById(@Param("userId") String userId);

    /**
     * 사용자 정보를 TB_USER 테이블에 저장 (회원가입)
     * @param registerRequestVO 회원가입 요청 정보
     * @return 성공적으로 삽입된 레코드 수 (1 또는 0)
     */
    int register(RegisterRequestVO registerRequestVO);

    /**
     * 특정 사용자 인벤토리에 상품을 추가
     * (회원가입 시 무료 지급, 구매 시 사용)
     * @param userId 사용자 ID
     * @param productId 상품 ID (5번: 무료 부화기)
     * @param quantity 지급 수량 (1)
     * @return 성공적으로 삽입된 레코드 수
     */
    int insertUserInventory(@Param("userId") String userId, @Param("productId") int productId, @Param("quantity") int quantity);

    /**
     * 중복 확인: ID, 닉네임, 이메일 중 하나라도 중복되는지 확인
     */
    int checkDuplicate(@Param("type") String type, @Param("value") String value);

    /**
     * 사용자 계정 삭제 (회원 탈퇴)
     * @param userId 삭제할 사용자 ID
     * @return 성공적으로 삭제된 레코드 수
     */
    int deleteUser(String userId);

    /**
     * 이름과 이메일로 사용자 ID를 조회 (아이디 찾기)
     * @param userName 사용자 이름
     * @param userEmail 사용자 이메일
     * @return 일치하는 사용자 ID (없으면 null)
     */
    String findUserIdByNameAndEmail(@Param("userName") String userName, @Param("userEmail") String userEmail);

    /**
     * 사용자 비밀번호 업데이트 (비밀번호 찾기/변경)
     * @param userId 비밀번호를 변경할 사용자 ID
     * @param newHashedPassword 새로 암호화된 비밀번호
     * @return 성공적으로 업데이트된 레코드 수
     */
    int updatePassword(@Param("userId") String userId, @Param("newHashedPassword") String newHashedPassword);

    /**
     * 소셜 로그인 ID(USER_ID)를 기반으로 사용자 정보를 조회
     * @param socialId 소셜 ID (예: "google_user@email.com")
     * @return LoginVO 객체 (사용자 전체 정보)
     */
    LoginVO selectUserBySocialId(@Param("userId") String socialId);

    /**
     * 소셜 사용자 정보를 TB_USER 테이블에 저장 (간소화된 회원가입)
     * @param user 소셜 사용자 정보 (LoginVO)
     * @return 성공적으로 삽입된 레코드 수 (1 또는 0)
     */
    int insertSocialUser(LoginVO user);

    /**
     * 사용자 이메일을 기반으로 TB_USER에서 사용자 정보를 조회
     * @param userEmail 조회할 사용자 이메일
     * @return LoginVO 객체 (사용자 전체 정보)
     */
    LoginVO selectUserByEmail(@Param("userEmail") String userEmail);

    /**
     * 캐릭터 생성 완료 후, TB_USER의 대표 캐릭터 정보를 업데이트
     * @param userId 사용자 ID
     * @return 성공적으로 업데이트된 레코드 수
     */
    int updateUserCharacterInfo(@Param("userId") String userId);

    /**
     * 특정 사용자의 인벤토리에서 상품 수량을 1 감소 (TB_USER_INVENTORY.QUANTITY)
     * @param userId 사용자 ID
     * @param productId 감소시킬 상품 ID (5:무료, 4:일반)
     * @return 성공적으로 업데이트된 레코드 수 (1 또는 0)
     */
    int decrementUserInventoryQuantity(@Param("userId") String userId, @Param("productId") int productId);


    /**
     * 특정 사용자의 부화권 수량을 1 감소 (TB_USER.INCUBATOR_COUNT)
     * @param userId 사용자 ID
     * @return 성공적으로 업데이트된 레코드 수 (1 또는 0)
     */
    int decrementIncubatorCount(@Param("userId") String userId);

}