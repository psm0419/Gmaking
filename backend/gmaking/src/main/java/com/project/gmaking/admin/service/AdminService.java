// src/main/java/com/project/gmaking.admin.service/AdminService.java
package com.project.gmaking.admin.service;

import com.project.gmaking.admin.dao.AdminDAO;
import com.project.gmaking.admin.vo.CharacterVO;
import com.project.gmaking.admin.vo.PurchaseVO;
import com.project.gmaking.admin.vo.InventoryVO;
import com.project.gmaking.login.vo.LoginVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final AdminDAO adminDAO;

    // 1. 모든 사용자 목록 조회
    public List<LoginVO> getAllUsers() {
        return adminDAO.selectAllUsers();
    }

    // 2. 모든 캐릭터 목록 조회
    public List<CharacterVO> getAllCharacters() {
        return adminDAO.selectAllCharacters();
    }

    // 3. 모든 구매 내역 조회
    public List<PurchaseVO> getAllPurchases() {
        return adminDAO.selectAllPurchases();
    }

    // 4. 모든 인벤토리 목록 조회
    public List<InventoryVO> getAllInventory() {
        return adminDAO.selectAllInventory();
    }
}