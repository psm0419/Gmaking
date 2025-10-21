package com.project.gmaking.shop.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseVO {
    private Long purchaseId;
    private String userId;
    private Integer productId;
    private Integer quantity;

    private Integer amountPaid;
    private String currency;
    private String pgProvider;
    private String method;

    private String merchantUid;
    private String impUid;
    private String status;        // READY/PAID/FAILED/CANCELLED/REFUNDED
    private String failedReason;

    private String productNameSnap;
    private Integer unitPriceSnap;
    private Integer totalPriceSnap;

    private LocalDateTime approvedAt;
    private LocalDateTime appliedAt;
    private LocalDateTime createdDate;
    private LocalDateTime updatedDate;
}
