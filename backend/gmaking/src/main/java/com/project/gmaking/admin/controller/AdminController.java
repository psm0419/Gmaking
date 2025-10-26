package com.project.gmaking.admin.controller;

import com.project.gmaking.admin.service.AdminService;
import com.project.gmaking.admin.vo.CharacterVO;
import com.project.gmaking.admin.vo.PurchaseVO;
import com.project.gmaking.admin.vo.InventoryVO;
import com.project.gmaking.login.vo.LoginVO;
import com.project.gmaking.admin.vo.AdminSearchCriteria;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    private AdminSearchCriteria createCriteria(int page, int pageSize, String searchKeyword) {
        return new AdminSearchCriteria(page, pageSize, searchKeyword);
    }


    // 1. 사용자 목록 조회 (페이징, 검색, 필터링 적용)
    @GetMapping("/users")
    public ResponseEntity<Map<String, Object>> getAllUsers(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "8") int pageSize,
            @RequestParam(required = false) String searchKeyword,
            @RequestParam(required = false) String filterRole
    ) {
        AdminSearchCriteria criteria = createCriteria(page, pageSize, searchKeyword);
        criteria.setFilterRole(filterRole);

        Map<String, Object> result = adminService.getAllUsers(criteria);
        return ResponseEntity.ok(result);
    }

    // 캐릭터 목록 조회 (페이징, 검색, 필터링 적용)
    @GetMapping("/characters")
    public ResponseEntity<Map<String, Object>> getAllCharacters(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "8") int pageSize,
            @RequestParam(required = false) String searchKeyword,
            @RequestParam(required = false) Integer filterGradeId
    ) {
        AdminSearchCriteria criteria = createCriteria(page, pageSize, searchKeyword);
        criteria.setFilterGradeId(filterGradeId);

        Map<String, Object> result = adminService.getAllCharacters(criteria);
        return ResponseEntity.ok(result);
    }

    // 구매 내역 목록 조회 (페이징, 검색, 필터링 적용)
    @GetMapping("/purchases")
    public ResponseEntity<Map<String, Object>> getAllPurchases(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "8") int pageSize,
            @RequestParam(required = false) String searchKeyword,
            @RequestParam(required = false) String filterStatus
    ) {
        AdminSearchCriteria criteria = createCriteria(page, pageSize, searchKeyword);
        criteria.setFilterStatus(filterStatus);

        Map<String, Object> result = adminService.getAllPurchases(criteria);
        return ResponseEntity.ok(result);
    }

    // 인벤토리 목록 조회 (페이징, 검색, 필터링 적용)
    @GetMapping("/inventory")
    public ResponseEntity<Map<String, Object>> getAllInventory(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "8") int pageSize,
            @RequestParam(required = false) String searchKeyword,
            @RequestParam(required = false) Integer filterProductId
    ) {
        AdminSearchCriteria criteria = createCriteria(page, pageSize, searchKeyword);
        criteria.setFilterProductId(filterProductId);

        Map<String, Object> result = adminService.getAllInventory(criteria);
        return ResponseEntity.ok(result);
    }
}