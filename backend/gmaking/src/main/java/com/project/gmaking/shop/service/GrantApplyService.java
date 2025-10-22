package com.project.gmaking.shop.service;

import com.project.gmaking.shop.dao.ShopPurchaseDAO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class GrantApplyService {
    private final ShopPurchaseDAO shopPurchaseDAO;

    /** CONSUMABLE: 부화권 수량 누적 */
    @Transactional
    public void applyConsumable(String userId, int addQuantity) {
        shopPurchaseDAO.upsertIncubator(userId, addQuantity);
        shopPurchaseDAO.refreshUserIncubatorCache(userId); // 있으면 그대로 사용
    }

    /** ENTITLEMENT: 광고제거 만료 연장 */
    @Transactional
    public LocalDateTime applyEntitlement(String userId, int addDays) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime current = shopPurchaseDAO.selectAdFreeMaxExpiry(userId);
        LocalDateTime base = (current != null && current.isAfter(now)) ? current : now;
        LocalDateTime newExpiry = base.plusDays(addDays);

        shopPurchaseDAO.upsertAdFreeInventory(userId, addDays, newExpiry);
        shopPurchaseDAO.updateUserAdFree(userId, newExpiry);
        return newExpiry;
    }

}
