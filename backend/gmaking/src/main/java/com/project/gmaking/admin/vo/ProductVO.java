package com.project.gmaking.admin.vo;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ProductVO {
    private Integer productId;          // PRODUCT_ID
    private String productName;         // PRODUCT_NAME
    private String productType;         // PRODUCT_TYPE
    private Integer price;              // PRICE
    private String currencyType;        // CURRENCY_TYPE
    private String isSale;              // IS_SALE (Y/N)
    private Integer durationDays;       // DURATION_DAYS
    private Integer packSize;           // PACK_SIZE
    private Integer grantProductId;     // GRANT_PRODUCT_ID
    private Integer salePrice;          // SALE_PRICE
    private LocalDateTime createdDate;  // CREATED_DATE
    private String createdBy;           // CREATED_BY
    private LocalDateTime updatedDate;  // UPDATED_DATE
    private String updatedBy;           // UPDATED_BY
}