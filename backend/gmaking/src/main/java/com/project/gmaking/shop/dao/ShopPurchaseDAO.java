package com.project.gmaking.shop.dao;

import com.project.gmaking.shop.vo.ProductVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;

@Mapper
public interface ShopPurchaseDAO {
    // 상품 메타 조회
    ProductVO selectProductMeta(@Param("productId") int productId);

    // 부화기 수량 업서트
    int upsertIncubator(@Param("userId") String userId,
                        @Param("quantity") int quantity);

    // 광고 제거 만료 조회(가장 최신)
    LocalDateTime selectAdFreeMaxExpiry(@Param("userId") String userId);

    // 광고 제거 만료 조회(가장 최신)
    int upsertAdFreeInventory(@Param("userId") String userId,
                              @Param("quantity") int quantity,
                              @Param("newExpiry") LocalDateTime newExpiry);

    // 합계로 갱신
    int refreshUserIncubatorCache(@Param("userId") String userId);

    // 유저 테이블에 업뎃
    int updateUserAdFree(@Param("userId") String userId,
                         @Param("newExpiry") java.time.LocalDateTime newExpiry);


}
