package com.project.gmaking.admin.dao;

import com.project.gmaking.admin.vo.*;
import com.project.gmaking.login.vo.LoginVO;

import java.util.List;

public interface AdminDAO {
    // 1. 사용자 목록
    List<LoginVO> selectAllUsers(AdminSearchCriteria criteria);
    int countAllUsers(AdminSearchCriteria criteria);

    // 2. 캐릭터 목록
    List<CharacterVO> selectAllCharacters(AdminSearchCriteria criteria);
    int countAllCharacters(AdminSearchCriteria criteria);

    // 3. 구매 내역 목록
    List<PurchaseVO> selectAllPurchases(AdminSearchCriteria criteria);
    int countAllPurchases(AdminSearchCriteria criteria);

    // 4. 인벤토리 목록
    List<InventoryVO> selectAllInventory(AdminSearchCriteria criteria);
    int countAllInventory(AdminSearchCriteria criteria);

    // 5. 상품 목록
    List<ProductVO>  selectAllProducts(AdminSearchCriteria criteria);
    int countAllProducts(AdminSearchCriteria criteria);
}