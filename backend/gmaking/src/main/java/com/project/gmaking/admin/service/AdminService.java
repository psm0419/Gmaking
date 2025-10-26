package com.project.gmaking.admin.service;

import com.project.gmaking.admin.dao.AdminDAO;
import com.project.gmaking.admin.vo.CharacterVO;
import com.project.gmaking.admin.vo.PurchaseVO;
import com.project.gmaking.admin.vo.InventoryVO;
import com.project.gmaking.login.vo.LoginVO;
import com.project.gmaking.admin.vo.AdminSearchCriteria;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

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
}