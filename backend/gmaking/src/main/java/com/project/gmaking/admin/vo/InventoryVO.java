package com.project.gmaking.admin.vo;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class InventoryVO {
    private Integer inventoryId;        // INVENTORY_ID
    private String userId;              // USER_ID
    private Integer productId;          // PRODUCT_ID
    private Integer quantity;           // QUANTITY
    private LocalDateTime expiryDate;   // EXPIRY_DATE
    private LocalDateTime acquiredDate; // ACQUIRED_DATE
    private LocalDateTime updatedDate;  // UPDATED_DATE

    // 조인 정보
    private String userNickname;        // tb_user.USER_NICKNAME

    // 상품 정보를 위한 임시 필드 (필요시 tb_product와 조인하여 추가 정보 가져올 수 있음)
    // private String productName;
}