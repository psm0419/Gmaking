package com.project.gmaking.admin.controller;

import com.project.gmaking.admin.service.AdminService;
import com.project.gmaking.admin.vo.CharacterVO;
import com.project.gmaking.admin.vo.PurchaseVO;
import com.project.gmaking.admin.vo.InventoryVO;
import com.project.gmaking.login.vo.LoginVO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/users")
    public ResponseEntity<List<LoginVO>> getAllUsers() {
        List<LoginVO> users = adminService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    // 캐릭터 목록 조회
    @GetMapping("/characters")
    public ResponseEntity<List<CharacterVO>> getAllCharacters() {
        List<CharacterVO> characters = adminService.getAllCharacters();
        return ResponseEntity.ok(characters);
    }

    // 구매 내역 목록 조회 (새로 추가)
    @GetMapping("/purchases")
    public ResponseEntity<List<PurchaseVO>> getAllPurchases() {
        List<PurchaseVO> purchases = adminService.getAllPurchases();
        return ResponseEntity.ok(purchases);
    }

    @GetMapping("/inventory")
    public ResponseEntity<List<InventoryVO>> getAllInventory() {
        List<InventoryVO> inventory = adminService.getAllInventory();
        return ResponseEntity.ok(inventory);
    }
}