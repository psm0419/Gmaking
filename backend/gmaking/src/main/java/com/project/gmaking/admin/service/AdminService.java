package com.project.gmaking.admin.service;

import com.project.gmaking.admin.dao.AdminDAO;
import com.project.gmaking.admin.vo.*;
import com.project.gmaking.character.service.GcsService;
import com.project.gmaking.character.vo.ImageUploadResponseVO;
import com.project.gmaking.login.vo.LoginVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final AdminDAO adminDAO;
    private final GcsService gcsService;
    private final String GCS_MONSTER_FOLDER = "monster";

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

    @Transactional
    public void giveItemToUser(String userId, int productId, int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("수량은 1개 이상이어야 합니다.");
        }

        Map<String, Object> params = new HashMap<>();
        params.put("userId", userId);
        params.put("productId", productId);
        params.put("quantity", quantity);

        // 인벤토리 업데이트 (tb_user_inventory)
        adminDAO.giveItemToUser(params);

        // 인큐베이터 카운트 업데이트 (tb_user) - 상품 ID 4, 5 (부화기 관련)일 경우
        if (productId == 4 || productId == 5) {
            adminDAO.updateUserIncubatorCount(params);
        }
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

    // 상품 수정
    public void updateProduct(ProductVO productVO) {
        adminDAO.updateProduct(productVO);
    }

    // 상품 삭제
    public void deleteProduct(int productId) {
        adminDAO.deleteProduct(productId);
    }

    // 상품 추가
    public int createProduct(ProductVO product) {
        return adminDAO.insertProduct(product);
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

    // 게시글 삭제
    @Transactional
    public void deletePost(long postId) {
        adminDAO.deletePost(postId);
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

    // -------------------------------------------------------------------------- //

    /**
     * 8. 몬스터 목록 조회 (페이징/검색/필터 적용)
     */
    public Map<String, Object> getAllMonsters(AdminSearchCriteria criteria) {
        int totalCount = adminDAO.countAllMonsters(criteria);
        List<MonsterVO> monsters = adminDAO.selectAllMonsters(criteria);

        Map<String, Object> result = new HashMap<>();
        result.put("list", monsters);
        result.put("totalCount", totalCount);
        result.put("currentPage", criteria.getPage());
        result.put("pageSize", criteria.getPageSize());
        int totalPages = (int) Math.ceil((double) totalCount / criteria.getPageSize());
        result.put("totalPages", totalPages);

        return result;
    }

    /**
     * 몬스터 이미지 파일 저장 (GCS 사용)
     * @param imageFile 업로드된 파일
     * @return 저장된 파일의 공개 URL
     */
    private String saveMonsterImageToGCS(MultipartFile imageFile) throws IOException {
        if (imageFile == null || imageFile.isEmpty()) {
            return null;
        }

        // GcsService의 uploadFile 메서드를 사용하여 GCS에 업로드
        ImageUploadResponseVO response = gcsService.uploadFile(imageFile, GCS_MONSTER_FOLDER);

        // DB에는 공개 URL을 저장
        return response.getFileUrl();
    }

    /**
     * 몬스터 생성 (GCS 사용)
     */
    @Transactional
    public void createMonster(MonsterVO monster, MultipartFile imageFile) throws IOException {
        String imagePath = saveMonsterImageToGCS(imageFile);
        monster.setImagePath(imagePath);
        adminDAO.insertMonster(monster);
    }

    /**
     * 몬스터 상세 조회
     */
    public MonsterVO getMonsterById(int monsterId) {
        return adminDAO.selectMonsterById(monsterId);
    }

    /**
     * 몬스터 수정 (GCS 사용)
     */
    @Transactional
    public void updateMonster(MonsterVO monster, MultipartFile imageFile) throws IOException {
        if (imageFile != null && !imageFile.isEmpty()) {
            String newImagePath = saveMonsterImageToGCS(imageFile);
            monster.setImagePath(newImagePath);
        } else {
            monster.setImagePath(null);
        }

        adminDAO.updateMonster(monster);
    }

    /**
     * 몬스터 삭제
     */
    @Transactional
    public void deleteMonster(int monsterId) {
        adminDAO.deleteMonsterById(monsterId);
    }

}