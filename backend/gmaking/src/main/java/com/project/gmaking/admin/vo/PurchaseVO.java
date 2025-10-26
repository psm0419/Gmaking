package com.project.gmaking.admin.vo;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class PurchaseVO {
    private Long purchaseId;            // PURCHASE_ID
    private String userId;              // USER_ID
    private Integer productId;          // PRODUCT_ID
    private Integer quantity;           // QUANTITY
    private Integer amountPaid;         // AMOUNT_PAID
    private String currency;            // CURRENCY
    private String pgProvider;          // PG_PROVIDER
    private String method;              // METHOD
    private String merchantUid;         // MERCHANT_UID
    private String impUid;              // IMP_UID
    private String status;              // STATUS (Enum을 String으로 처리)
    private String failedReason;        // FAILED_REASON
    private String productNameSnap;     // PRODUCT_NAME_SNAP
    private Integer unitPriceSnap;      // UNIT_PRICE_SNAP
    private Integer totalPriceSnap;     // TOTAL_PRICE_SNAP
    private LocalDateTime approvedAt;   // APPROVED_AT
    private LocalDateTime appliedAt;    // APPLIED_AT
    private LocalDateTime createdDate;  // CREATED_DATE
    private LocalDateTime updatedDate;  // UPDATED_DATE

    // 조인 정보
    private String userNickname;        // tb_user.USER_NICKNAME
}