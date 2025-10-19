package com.project.gmaking.shop.service;

import com.project.gmaking.shop.dao.ShopProfileDAO;
import com.project.gmaking.shop.dao.ShopPurchaseDAO;
import com.project.gmaking.shop.vo.ProductVO;
import com.project.gmaking.shop.vo.PurchaseRequestVo;
import com.project.gmaking.shop.vo.ShopProfileVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class ShopPurchaseService {

    private final ShopPurchaseDAO purchaseDAO;
    private final ShopProfileDAO  profileDAO;

    /**
     * 구매 처리의 메인 엔트리 (프론트에서 호출)
     */
    @Transactional
    public ShopProfileVO purchase(String userId, PurchaseRequestVo req) {
        if (userId == null || userId.isBlank())
            throw new IllegalArgumentException("unauthorized");

        if (req == null || req.getProductId() == null)
            throw new IllegalArgumentException("productId is required");

        final int productId = req.getProductId();
        final int quantity = (req.getQuantity() == null || req.getQuantity() <= 0) ? 1 : req.getQuantity();

        // 상품 메타 조회/검증
        ProductVO meta = purchaseDAO.selectProductMeta(productId);
        if (meta == null) {
            throw new IllegalArgumentException("product not found: " + productId);
        }
        if (!"Y".equalsIgnoreCase(String.valueOf(meta.getIsSale()))) {
            throw new IllegalStateException("product not for sale: " + productId);
        }

        // 2) 타입별 처리
        String type = String.valueOf(meta.getProductType());
        switch (type) {
            case "CONSUMABLE": {
                // ex) 상품 2(5개), 3(15개) → 부화기(product_id=4) 수량 증가
                Integer packSize = meta.getPackSize();
                if (packSize == null || packSize <= 0) {
                    throw new IllegalStateException("invalid pack size for product " + productId);
                }
                int add = packSize * quantity;   // 지급할 총 부화기 개수
                int up = purchaseDAO.upsertIncubator(userId, add);
                log.info("[Purchase] incubators added={}, user={}", add, userId);

                // 캐시 갱신(단일 유저)
                purchaseDAO.refreshUserIncubatorCache(userId);
                break;
            }
            case "ENTITLEMENT": {
                // ex) 상품 1(광고 제거 30일)
                Integer days = meta.getDurationDays();
                if (days == null || days <= 0) {
                    throw new IllegalStateException("invalid durationDays for product " + productId);
                }
                int totalDays = days * quantity;

                LocalDateTime now = LocalDateTime.now();
                LocalDateTime currentExpiry = purchaseDAO.selectAdFreeMaxExpiry(userId);
                LocalDateTime base = (currentExpiry != null && currentExpiry.isAfter(now)) ? currentExpiry : now;
                LocalDateTime newExpiry = base.plusDays(totalDays);

                purchaseDAO.upsertAdFreeInventory(userId, quantity, newExpiry);
                purchaseDAO.updateUserAdFree(userId, newExpiry);
                log.info("[Purchase] ad-free extended to {}, user={}", newExpiry, userId);


                break;
            }
            default:
                throw new IllegalStateException("unsupported product type: " + type);
        }

        // 최신 프로필 반환
        return profileDAO.selectShopProfile(userId);
    }
}
