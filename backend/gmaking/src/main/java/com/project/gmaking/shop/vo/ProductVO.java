package com.project.gmaking.shop.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductVO {
    private Integer productId;
    private String productName;
    private String productType;
    private Integer price;
    private String currencyType;
    private String isSale;
    private Integer durationDays;
    private Integer packSize;
    private Integer grantProductId;
    private Integer salePrice;
}
