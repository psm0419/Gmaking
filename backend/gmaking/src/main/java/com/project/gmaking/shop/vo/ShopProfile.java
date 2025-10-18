package com.project.gmaking.shop.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShopProfile {
    private String userId;
    private String nickName;
    private String profileImageUrl;
    private int incubatorCount;  //
}
