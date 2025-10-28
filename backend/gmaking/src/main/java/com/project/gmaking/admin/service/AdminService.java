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

    private String getCurrentAdminId() {
        return "ADMIN";
    }

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

    /**
     * 신고 처리 (승인/거절/검토 완료) 및 연관 조치 (Transactional)
     * @param reportId 처리할 신고 ID
     * @param status 변경할 상태 (REJECTED, APPROVED, REVIEWED)
     */
    @Transactional
    public void processReport(long reportId, String status) {
        String adminId = getCurrentAdminId();

        // 1. 신고 정보 조회 및 상태 검증
        ReportVO report = adminDAO.selectReportDetail(reportId);

        if (report == null || !"PENDING".equals(report.getStatus())) {
            throw new IllegalArgumentException("처리 대기 중인 신고가 아니거나 존재하지 않는 신고입니다.");
        }

        if (!("REJECTED".equals(status) || "APPROVED".equals(status) || "REVIEWED".equals(status))) {
            throw new IllegalArgumentException("유효하지 않은 처리 상태 코드입니다.");
        }

        Map<String, Object> statusUpdateParams = new HashMap<>();
        statusUpdateParams.put("reportId", reportId);
        statusUpdateParams.put("status", status);
        statusUpdateParams.put("updatedBy", adminId);
        adminDAO.updateReportStatus(statusUpdateParams);

        // 3. 'APPROVED' 상태일 경우 조치 (게시글/댓글 삭제)
        if ("APPROVED".equals(status)) {
            String targetType = report.getTargetType();
            long targetId = report.getTargetId();

            if ("POST".equals(targetType)) {
                adminDAO.deletePost(targetId);
            } else if ("COMMENT".equals(targetType)) {
                adminDAO.deleteComment(targetId);
            }
        }
    }

    // -------------------------------------------------------------------------- //

    /**
     * 몬스터 목록 조회 (Read List)
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
     * 몬스터 상세 조회 (Read Detail)
     */
    public MonsterVO getMonsterDetail(int monsterId) {
        return adminDAO.selectMonsterDetail(monsterId);
    }

    /**
     * 몬스터 등록 (Create)
     */
    @Transactional
    public void createMonster(MonsterVO monsterVO, MultipartFile imageFile) throws IOException {
        String adminId = getCurrentAdminId();

        if (imageFile.isEmpty()) {
            throw new IllegalArgumentException("몬스터 이미지는 필수입니다.");
        }

        // GCS에 이미지 업로드
        ImageUploadResponseVO uploadResponse = gcsService.uploadFile(imageFile, GCS_MONSTER_FOLDER);

        // tb_image에 정보 삽입
        ImageVO imageVO = new ImageVO();
        imageVO.setImageOriginalName(imageFile.getOriginalFilename());
        imageVO.setImageUrl(uploadResponse.getFileUrl());
        imageVO.setImageName(uploadResponse.getFileName());
        imageVO.setImageType(2);
        imageVO.setCreatedBy(adminId);

        adminDAO.insertImage(imageVO);

        // 3. tb_monster에 정보 삽입
        monsterVO.setImageId(imageVO.getImageId());
        monsterVO.setCreatedBy(adminId);

        adminDAO.insertMonster(monsterVO);
    }

    /**
     * 몬스터 정보 수정 (Update)
     * 새 이미지가 있다면, GCS 업로드 및 기존 이미지 삭제 처리 포함
     */
    @Transactional
    public void updateMonster(MonsterVO monsterVO, MultipartFile newImageFile) throws IOException {
        String adminId = getCurrentAdminId();

        // 이미지 파일 처리
        if (newImageFile != null && !newImageFile.isEmpty()) {

            // 기존 몬스터 정보 조회
            MonsterVO oldMonster = adminDAO.selectMonsterDetail(monsterVO.getMonsterId());
            if (oldMonster == null) {
                throw new IllegalArgumentException("존재하지 않는 몬스터입니다.");
            }
            Integer imageId = oldMonster.getImageId();
            String oldImageName = oldMonster.getImageName();
            ImageUploadResponseVO uploadResponse = gcsService.uploadFile(newImageFile, GCS_MONSTER_FOLDER);

            // tb_image 정보 업데이트
            ImageVO imageVO = new ImageVO();
            imageVO.setImageId(imageId);
            imageVO.setImageOriginalName(newImageFile.getOriginalFilename());
            imageVO.setImageUrl(uploadResponse.getFileUrl());
            imageVO.setImageName(uploadResponse.getFileName());
            imageVO.setUpdatedBy(adminId);

            adminDAO.updateImage(imageVO);

            // GCS에서 기존 이미지 삭제
            if (oldImageName != null) {
                gcsService.deleteFile(oldImageName);
            }
        }

        // 2. tb_monster 정보 업데이트
        monsterVO.setUpdatedBy(adminId);
        adminDAO.updateMonster(monsterVO);
    }

    /**
     * 몬스터 삭제 (Delete)
     * DB 삭제 전 GCS 파일 삭제를 위해 이미지 정보를 먼저 조회
     */
    @Transactional
    public void deleteMonster(int monsterId) throws IOException {

        // 몬스터 정보 조회 (삭제할 이미지 ID와 이름 확보)
        MonsterVO monsterToDelete = adminDAO.selectMonsterDetail(monsterId);

        if (monsterToDelete == null) {
            return;
        }

        Integer imageId = monsterToDelete.getImageId();
        String imageName = monsterToDelete.getImageName();

        // DB 정보 삭제 (부모 -> 자식)
        adminDAO.deleteMonster(monsterId);
        adminDAO.deleteImage(imageId);

        // GCS에서 파일 삭제
        if (imageName != null) {
            gcsService.deleteFile(imageName);
        }
    }

}