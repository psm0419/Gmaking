package com.project.gmaking.shop.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShopProfileVO {
    private String userId;
    private String nickName;
    private String profileImageUrl;
    private int incubatorCount;  // 이후에 삭제
}
