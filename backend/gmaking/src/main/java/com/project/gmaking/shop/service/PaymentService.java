package com.project.gmaking.shop.service;

import com.project.gmaking.shop.dao.PaymentDAO;
import com.project.gmaking.shop.dao.ShopPurchaseDAO;
import com.project.gmaking.shop.vo.GrantVO;
import com.project.gmaking.shop.vo.PurchaseVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PaymentService {
    private final PaymentDAO paymentDAO;
    private final ShopPurchaseDAO shopPurchaseDAO;
    private final GrantApplyService grantApplyService;
    private final IamportClient iamport; // 아래 래퍼

    /** 결제 준비 (원시 파라미터 → Map 반환) */
    @Transactional
    public Map<String, Object> prepare(String userId, int productId, int quantity) {
        var meta = shopPurchaseDAO.selectProductMeta(productId);
        if (meta == null || !"Y".equalsIgnoreCase(String.valueOf(meta.getIsSale()))) {
            throw new IllegalArgumentException("판매 불가 상품");
        }
        int unit = (meta.getSalePrice() != null && meta.getSalePrice() > 0)
                ? meta.getSalePrice() : meta.getPrice();
        int qty = Math.max(1, quantity);
        int total = unit * qty;

        String merchantUid = "GMK-" + System.currentTimeMillis() + "-" + userId;

        var p = PurchaseVO.builder()
                .userId(userId)
                .productId(productId)
                .quantity(qty)
                .merchantUid(merchantUid)
                .productNameSnap(meta.getProductName())
                .unitPriceSnap(unit)
                .totalPriceSnap(total)
                .build();

        paymentDAO.insertReadyPurchase(p);

        Map<String, Object> out = new HashMap<>();
        out.put("merchantUid", merchantUid);
        out.put("amount", total);
        out.put("productName", meta.getProductName());
        return out;
    }

    /** 결제 검증 및 지급 (원시 파라미터 → Map/문자열 반환) */
    @Transactional
    public Map<String, Object> confirm(String userId, String impUid, String merchantUid) {
        PurchaseVO pur = paymentDAO.selectByMerchantUid(merchantUid);
        if (pur == null || !userId.equals(pur.getUserId()))
            throw new IllegalArgumentException("주문 없음 또는 사용자 불일치");

        // 멱등 처리: 이미 지급 완료면 바로 OK
        if ("PAID".equals(pur.getStatus()) && pur.getAppliedAt() != null) {
            return Map.of("result", "ALREADY_APPLIED");
        }

        // 아임포트 조회/검증
        var pay = iamport.getPayment(impUid);
        if (!"paid".equalsIgnoreCase(pay.getStatus()))
            throw new IllegalStateException("결제 미완료");
        if (!merchantUid.equals(pay.getMerchantUid()))
            throw new IllegalStateException("merchant_uid 불일치");
        if (pur.getTotalPriceSnap().intValue() != pay.getAmount().intValue())
            throw new IllegalStateException("금액 불일치");

        paymentDAO.markPaid(merchantUid, impUid, pay.getAmount().intValue(), pay.getPgProvider(), pay.getPayMethod());

        // 지급 저널 작성(PENDING)
        GrantVO g = GrantVO.builder()
                .purchaseId(pur.getPurchaseId())
                .userId(pur.getUserId())
                .productId(pur.getProductId())
                .quantity(pur.getQuantity())
                .build();
        paymentDAO.insertGrant(g);

        // 타입별 지급
        var meta = shopPurchaseDAO.selectProductMeta(pur.getProductId());
        switch (String.valueOf(meta.getProductType())) {
            case "CONSUMABLE": {
                int add = Math.max(1, pur.getQuantity()) * meta.getPackSize();
                grantApplyService.applyConsumable(userId, add);
                break;
            }
            case "ENTITLEMENT": {
                int addDays = Math.max(1, pur.getQuantity()) * meta.getDurationDays();
                LocalDateTime newExpiry = grantApplyService.applyEntitlement(userId, addDays);
                g.setExpiresAt(newExpiry);
                break;
            }
            default:
                throw new IllegalStateException("지원하지 않는 상품 타입");
        }

        // 저널 APPLIED + 구매 APPLIED_AT
        paymentDAO.markGrantApplied(g.getGrantId(), null);
        paymentDAO.markApplied(pur.getPurchaseId());

        return Map.of("result", "OK");
    }
}
