package com.project.gmaking.admin.service;

import com.project.gmaking.admin.dao.AdminDAO;
import com.project.gmaking.admin.vo.*;
import com.project.gmaking.login.vo.LoginVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final AdminDAO adminDAO;

    // 사용자 목록 조회
    public Map<String, Object> getAllUsers(AdminSearchCriteria criteria) {
        int totalCount = adminDAO.countAllUsers(criteria);

        List<LoginVO> users = adminDAO.selectAllUsers(criteria);

        Map<String, Object> result = new HashMap<>();
        result.put("list", users);
        result.put("totalCount", totalCount);
        result.put("currentPage", criteria.getPage());
        result.put("pageSize", criteria.getPageSize());

        int totalPages = (int) Math.ceil((double) totalCount / criteria.getPageSize());
        result.put("totalPages", totalPages);

        return result;
    }

    // -------------------------------------------------------------------------- //

    // 캐릭터 목록 조회
    public Map<String, Object> getAllCharacters(AdminSearchCriteria criteria) {
        int totalCount = adminDAO.countAllCharacters(criteria);
        List<CharacterVO> characters = adminDAO.selectAllCharacters(criteria);

        Map<String, Object> result = new HashMap<>();
        result.put("list", characters);
        result.put("totalCount", totalCount);
        result.put("currentPage", criteria.getPage());
        result.put("pageSize", criteria.getPageSize());
        int totalPages = (int) Math.ceil((double) totalCount / criteria.getPageSize());
        result.put("totalPages", totalPages);

        return result;
    }

    /**
     * 캐릭터 및 연관 데이터 삭제 (Transactional)
     * @param characterId 삭제할 캐릭터 ID
     */
    @Transactional
    public void deleteCharacter(int characterId) {
        // tb_character에서 USER_ID를 가져옴
        String userId = adminDAO.getUserIdByCharacterId(characterId);
        Integer imageId = adminDAO.getCharacterImageId(characterId);

        // 캐릭터 능력치 삭제 (tb_character_stat)
        adminDAO.deleteCharacterStat(characterId);

        // 캐릭터 정보 삭제 (tb_character)
        adminDAO.deleteCharacter(characterId);

        // 이미지 정보 삭제 (tb_image)
        if (imageId != null) {
            adminDAO.deleteImage(imageId);
        }

        // 유저 정보 업데이트: 삭제된 캐릭터가 대표 캐릭터였을 경우 초기화
        if (userId != null) {
            Map<String, Object> params = new HashMap<>();
            params.put("userId", userId);
            params.put("characterId", characterId);
            adminDAO.resetUserCharacterInfo(params);
        }
    }

    // -------------------------------------------------------------------------- //

    // 구매 내역 조회
    public Map<String, Object> getAllPurchases(AdminSearchCriteria criteria) {
        int totalCount = adminDAO.countAllPurchases(criteria);
        List<PurchaseVO> purchases = adminDAO.selectAllPurchases(criteria);

        Map<String, Object> result = new HashMap<>();
        result.put("list", purchases);
        result.put("totalCount", totalCount);
        result.put("currentPage", criteria.getPage());
        result.put("pageSize", criteria.getPageSize());
        int totalPages = (int) Math.ceil((double) totalCount / criteria.getPageSize());
        result.put("totalPages", totalPages);

        return result;
    }

    // -------------------------------------------------------------------------- //

    // 인벤토리 목록 조회
    public Map<String, Object> getAllInventory(AdminSearchCriteria criteria) {
        int totalCount = adminDAO.countAllInventory(criteria);
        List<InventoryVO> inventory = adminDAO.selectAllInventory(criteria);

        Map<String, Object> result = new HashMap<>();
        result.put("list", inventory);
        result.put("totalCount", totalCount);
        result.put("currentPage", criteria.getPage());
        result.put("pageSize", criteria.getPageSize());
        int totalPages = (int) Math.ceil((double) totalCount / criteria.getPageSize());
        result.put("totalPages", totalPages);

        return result;
    }

    // -------------------------------------------------------------------------- //

    // 상품 목록 조회
    public Map<String, Object> getAllProducts(AdminSearchCriteria criteria) {
        int totalCount = adminDAO.countAllProducts(criteria);
        List<ProductVO> products = adminDAO.selectAllProducts(criteria);

        Map<String, Object> result = new HashMap<>();
        result.put("list", products);
        result.put("totalCount", totalCount);
        result.put("currentPage", criteria.getPage());
        result.put("pageSize", criteria.getPageSize());
        int totalPages = (int) Math.ceil((double) totalCount / criteria.getPageSize());
        result.put("totalPages", totalPages);

        return result;
    }

    /**
     * 상품 정보 수정
     * @param productVO 수정할 상품 정보를 담은 VO
     */
    public void updateProduct(ProductVO productVO) {
        adminDAO.updateProduct(productVO);
    }

    /**
     * 상품 정보 삭제
     * @param productId 삭제할 상품 ID
     */
    public void deleteProduct(int productId) {
        adminDAO.deleteProduct(productId);
    }

    // -------------------------------------------------------------------------- //

    // 게시글 목록 조회
    public Map<String, Object> getAllPosts(AdminSearchCriteria criteria) {
        int totalCount = adminDAO.countAllPosts(criteria);
        List<CommunityPostVO> posts = adminDAO.selectAllPosts(criteria);

        Map<String, Object> result = new HashMap<>();
        result.put("list", posts);
        result.put("totalCount", totalCount);
        result.put("currentPage", criteria.getPage());
        result.put("pageSize", criteria.getPageSize());
        int totalPages = (int) Math.ceil((double) totalCount / criteria.getPageSize());
        result.put("totalPages", totalPages);

        return result;
    }

    // -------------------------------------------------------------------------- //

    // 신고 목록 조회
    public Map<String, Object> getAllReports(AdminSearchCriteria criteria) {
        int totalCount = adminDAO.countAllReports(criteria);
        List<ReportVO> reports = adminDAO.selectAllReports(criteria);

        Map<String, Object> result = new HashMap<>();
        result.put("list", reports);
        result.put("totalCount", totalCount);
        result.put("currentPage", criteria.getPage());
        result.put("pageSize", criteria.getPageSize());
        int totalPages = (int) Math.ceil((double) totalCount / criteria.getPageSize());
        result.put("totalPages", totalPages);

        return result;
    }
}