// src/main/java/com/project/gmaking/admin/dao/AdminDAO.java
package com.project.gmaking.admin.dao;

import com.project.gmaking.admin.vo.CharacterVO;
import com.project.gmaking.admin.vo.PurchaseVO;
import com.project.gmaking.admin.vo.InventoryVO;
import com.project.gmaking.login.vo.LoginVO;

import java.util.List;

public interface AdminDAO {
    // 1. 사용자 목록
    List<LoginVO> selectAllUsers();

    // 2. 캐릭터 목록
    List<CharacterVO> selectAllCharacters();

    // 3. 구매 내역 목록 (새로 추가)
    List<PurchaseVO> selectAllPurchases();

    // 4. 인벤토리 목록 (새로 추가)
    List<InventoryVO> selectAllInventory();
}