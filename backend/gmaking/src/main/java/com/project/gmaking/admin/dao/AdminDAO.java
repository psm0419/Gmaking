package com.project.gmaking.admin.dao;

import com.project.gmaking.admin.vo.*;
import com.project.gmaking.login.vo.LoginVO;

import java.util.List;
import java.util.Map;

public interface AdminDAO {
    // 1. 사용자 목록
    List<LoginVO> selectAllUsers(AdminSearchCriteria criteria);
    int countAllUsers(AdminSearchCriteria criteria);

    // 2. 캐릭터 목록
    List<CharacterVO> selectAllCharacters(AdminSearchCriteria criteria);
    int countAllCharacters(AdminSearchCriteria criteria);
    String getUserIdByCharacterId(int characterId);                     // 삭제할 캐릭터의 USER_ID 조회
    Integer getCharacterImageId(int characterId);                       // 캐릭터 이미지 ID 조회
    void deleteCharacterStat(int characterId);                          // 캐릭터 능력치 삭제
    void deleteCharacter(int characterId);                              // 캐릭터 정보 삭제 (tb_character)
    void deleteImage(int imageId);                                      // 이미지 정보 삭제
    void resetUserCharacterInfo(Map<String, Object> params);            // tb_user 대표 캐릭터 초기화

    // 3. 구매 내역 목록
    List<PurchaseVO> selectAllPurchases(AdminSearchCriteria criteria);
    int countAllPurchases(AdminSearchCriteria criteria);

    // 4. 인벤토리 목록 (부화권 지급, 부화권 카운트 업데이트)
    List<InventoryVO> selectAllInventory(AdminSearchCriteria criteria);
    int countAllInventory(AdminSearchCriteria criteria);
    void giveItemToUser(Map<String, Object> params);
    void updateUserIncubatorCount(Map<String, Object> params);

    // 5. 상품 목록
    List<ProductVO>  selectAllProducts(AdminSearchCriteria criteria);
    int countAllProducts(AdminSearchCriteria criteria);
    int insertProduct(ProductVO product);
    void updateProduct(ProductVO productVO);                            // 상품 수정
    void deleteProduct(int productId);                                  // 상품 삭제

    // 6. 게시글 목록
    List<CommunityPostVO> selectAllPosts(AdminSearchCriteria criteria);
    int countAllPosts(AdminSearchCriteria criteria);
    void deletePost(long postId);                                      // 게시글 삭제

    // 7. 신고 목록, 신고 상세 정보 조회
    List<ReportVO> selectAllReports(AdminSearchCriteria criteria);
    int countAllReports(AdminSearchCriteria criteria);
    ReportVO selectReportDetail(long reportId);
    void updateReportStatus(Map<String, Object> params);
    void deleteComment(long commentId);

    // 8. 몬스터 CRUD, 이미지 저장
    int insertImage(ImageVO imageVO);
    List<MonsterVO> selectAllMonsters(AdminSearchCriteria criteria);
    int countAllMonsters(AdminSearchCriteria criteria);
    MonsterVO selectMonsterDetail(int monsterId);
    int insertMonster(MonsterVO monsterVO);
    void updateMonster(MonsterVO monsterVO);
    void updateImage(ImageVO imageVO);
    Integer selectMonsterImageId(int monsterId);
    void deleteMonster(int monsterId);
}