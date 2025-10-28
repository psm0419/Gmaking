package com.project.gmaking.admin.controller;

import com.project.gmaking.admin.service.AdminService;
import com.project.gmaking.admin.vo.*;
import com.project.gmaking.login.vo.LoginVO;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
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

    @PostMapping("/inventory/give-item")
    public ResponseEntity<String> giveItemToUser(@RequestBody Map<String, Object> request) {
        try {
            String userId = (String) request.get("userId");
            Integer productId = request.get("productId") instanceof Integer ? (Integer) request.get("productId") : Integer.parseInt(request.get("productId").toString());
            Integer quantity = request.get("quantity") instanceof Integer ? (Integer) request.get("quantity") : Integer.parseInt(request.get("quantity").toString());

            if (userId == null || userId.isEmpty() || productId == null || quantity == null || quantity <= 0) {
                return ResponseEntity.badRequest().body("사용자 ID, 상품 ID, 수량을 올바르게 입력해주세요.");
            }

            adminService.giveItemToUser(userId, productId, quantity);
            return ResponseEntity.ok("아이템 지급이 완료되었습니다.");

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("아이템 지급 중 서버 오류가 발생했습니다.");
        }
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

    // 신고 처리 API (상태 변경 및 조치)
    // PUT /api/admin/reports/{reportId}/status
    @PutMapping("/reports/{reportId}/status")
    public ResponseEntity<String> processReport(
            @PathVariable("reportId") long reportId,
            @RequestBody Map<String, String> requestBody) {

        String status = requestBody.get("status");

        if (status == null) {
            return ResponseEntity.badRequest().body("상태(status) 값은 필수입니다.");
        }

        try {
            adminService.processReport(reportId, status);
            return ResponseEntity.ok().body("신고 처리가 완료되었습니다.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("신고 처리 중 오류가 발생했습니다.");
        }
    }

    // -------------------------------------------------------------------------- //

    /**
     * 몬스터 목록 조회 (Read List)
     * GET /api/admin/monsters?page=1&pageSize=6&searchKeyword=오크
     */
    @GetMapping("/monsters")
    public ResponseEntity<Map<String, Object>> getAllMonsters(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "6") int pageSize,
            @RequestParam(required = false) String searchKeyword,
            @RequestParam(required = false) String filterMonsterType
    ) {
        AdminSearchCriteria criteria = createCriteria(page, pageSize, searchKeyword);
        criteria.setFilterMonsterType(filterMonsterType);

        Map<String, Object> result = adminService.getAllMonsters(criteria);
        return ResponseEntity.ok(result);
    }

    /**
     * 몬스터 상세 조회 (Read Detail)
     * GET /api/admin/monsters/{monsterId}
     */
    @GetMapping("/monsters/{monsterId}")
    public ResponseEntity<MonsterVO> getMonsterDetail(@PathVariable("monsterId") int monsterId) {
        MonsterVO monster = adminService.getMonsterDetail(monsterId);
        if (monster == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(monster);
    }

    /**
     * 몬스터 등록 (Create)
     * POST /api/admin/monsters (multipart/form-data)
     * 이미지 파일과 몬스터 정보(JSON)를 함께 받음
     */
    @PostMapping("/monsters")
    public ResponseEntity<Void> createMonster(
            @RequestPart("monsterData") MonsterVO monsterVO,
            @RequestPart("imageFile") MultipartFile imageFile
    ) {
        try {
            adminService.createMonster(monsterVO, imageFile);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * 몬스터 수정 (Update)
     * PUT /api/admin/monsters/{monsterId} (multipart/form-data)
     * 이미지 파일을 옵션으로 받음
     */
    @PutMapping("/monsters/{monsterId}")
    public ResponseEntity<Void> updateMonster(
            @PathVariable("monsterId") int monsterId,
            @RequestPart("monsterData") MonsterVO monsterVO,
            @RequestPart(value = "newImageFile", required = false) MultipartFile newImageFile
    ) {
        try {
            monsterVO.setMonsterId(monsterId);
            adminService.updateMonster(monsterVO, newImageFile);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * 몬스터 삭제 (Delete)
     * DELETE /api/admin/monsters/{monsterId}
     */
    @DeleteMapping("/monsters/{monsterId}")
    public ResponseEntity<Void> deleteMonster(@PathVariable("monsterId") int monsterId) {
        try {
            adminService.deleteMonster(monsterId);
            return ResponseEntity.noContent().build();
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}