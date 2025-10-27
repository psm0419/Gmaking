package com.project.gmaking.admin.controller;

import com.project.gmaking.admin.service.AdminService;
import com.project.gmaking.admin.vo.*;
import com.project.gmaking.login.vo.LoginVO;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

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
            @RequestParam(defaultValue = "6") int pageSize,
            @RequestParam(required = false) String searchKeyword,
            @RequestParam(required = false) String filterRole
    ) {
        AdminSearchCriteria criteria = createCriteria(page, pageSize, searchKeyword);
        criteria.setFilterRole(filterRole);

        Map<String, Object> result = adminService.getAllUsers(criteria);
        return ResponseEntity.ok(result);
    }

    // -------------------------------------------------------------------------- //

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

    @DeleteMapping("/characters/{characterId}")
    public ResponseEntity<Void> deleteCharacter(@PathVariable("characterId") int characterId) {
        adminService.deleteCharacter(characterId);
        return ResponseEntity.noContent().build();
    }

    // -------------------------------------------------------------------------- //

    // 구매 내역 목록 조회 (페이징, 검색, 필터링 적용)
    @GetMapping("/purchases")
    public ResponseEntity<Map<String, Object>> getAllPurchases(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "6") int pageSize,
            @RequestParam(required = false) String searchKeyword,
            @RequestParam(required = false) String filterStatus
    ) {
        AdminSearchCriteria criteria = createCriteria(page, pageSize, searchKeyword);
        criteria.setFilterStatus(filterStatus);

        Map<String, Object> result = adminService.getAllPurchases(criteria);
        return ResponseEntity.ok(result);
    }

    // -------------------------------------------------------------------------- //

    // 인벤토리 목록 조회 (페이징, 검색, 필터링 적용)
    @GetMapping("/inventory")
    public ResponseEntity<Map<String, Object>> getAllInventory(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "6") int pageSize,
            @RequestParam(required = false) String searchKeyword,
            @RequestParam(required = false) Integer filterProductId
    ) {
        AdminSearchCriteria criteria = createCriteria(page, pageSize, searchKeyword);
        criteria.setFilterProductId(filterProductId);

        Map<String, Object> result = adminService.getAllInventory(criteria);
        return ResponseEntity.ok(result);
    }

    // -------------------------------------------------------------------------- //

    // 상품 목록 조회
    @GetMapping("/products")
    public ResponseEntity<Map<String, Object>> getAllProducts(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "6") int pageSize,
            @RequestParam(required = false) String searchKeyword,
            @RequestParam(required = false) String filterIsSale
    ) {
        AdminSearchCriteria criteria = createCriteria(page, pageSize, searchKeyword);
        criteria.setFilterIsSale(filterIsSale);

        Map<String, Object> result = adminService.getAllProducts(criteria);
        return ResponseEntity.ok(result);
    }

    // 상품 추가
    @PostMapping("/products")
    public ResponseEntity<String> createProduct(@RequestBody ProductVO productVO) {
        try {
            adminService.createProduct(productVO);

            return ResponseEntity.ok("상품이 성공적으로 등록되었습니다.");

        } catch (Exception e) {
            System.err.println("상품 등록 중 오류 발생: " + e.getMessage());
            return ResponseEntity.internalServerError().body("상품 등록에 실패했습니다.");
        }
    }

    /**
     * 상품 정보 수정
     * PUT /api/admin/products/{productId}
     */
    @PutMapping("/products/{productId}")
    public ResponseEntity<Void> updateProduct(
            @PathVariable("productId") int productId,
            @RequestBody ProductVO productVO
    ) {
        productVO.setProductId(productId);
        adminService.updateProduct(productVO);
        return ResponseEntity.noContent().build();
    }

    /**
     * 상품 삭제
     * DELETE /api/admin/products/{productId}
     */
    @DeleteMapping("/products/{productId}")
    public ResponseEntity<Void> deleteProduct(@PathVariable("productId") int productId) {
        adminService.deleteProduct(productId);
        return ResponseEntity.noContent().build();
    }

    // -------------------------------------------------------------------------- //

    // 게시글 목록 조회
    @GetMapping("/posts")
    public ResponseEntity<Map<String, Object>> getAllPosts(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "7") int pageSize,
            @RequestParam(required = false) String searchKeyword,
            @RequestParam(required = false) String filterCategory,
            @RequestParam(required = false) String filterIsDeleted
    ) {
        AdminSearchCriteria criteria = createCriteria(page, pageSize, searchKeyword);
        criteria.setFilterCategory(filterCategory);
        criteria.setFilterIsDeleted(filterIsDeleted);

        Map<String, Object> result = adminService.getAllPosts(criteria);
        return ResponseEntity.ok(result);
    }

    // 게시글 삭제
    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<Void> deletePost(@PathVariable("postId") long postId) {
        adminService.deletePost(postId);
        return ResponseEntity.noContent().build();
    }

    // -------------------------------------------------------------------------- //

    // 신고 목록 조회
    @GetMapping("/reports")
    public ResponseEntity<Map<String, Object>> getAllReports(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "7") int pageSize,
            @RequestParam(required = false) String searchKeyword,
            @RequestParam(required = false) String filterStatus,
            @RequestParam(required = false) String filterType
    ) {
        AdminSearchCriteria criteria = createCriteria(page, pageSize, searchKeyword);
        criteria.setFilterStatus(filterStatus);
        criteria.setFilterType(filterType);

        Map<String, Object> result = adminService.getAllReports(criteria);
        return ResponseEntity.ok(result);
    }
}