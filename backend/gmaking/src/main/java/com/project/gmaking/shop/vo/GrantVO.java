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
public class GrantVO {
    private Long grantId;
    private Long purchaseId;
    private String userId;
    private Integer productId;
    private Integer quantity;
    private LocalDateTime expiresAt;   // ENTITLEMENT용
    private String status;             // PENDING/APPLIED/REVOKED
    private Integer appliedInventoryId;
    private LocalDateTime createdDate;
    private LocalDateTime updatedDate;
}
