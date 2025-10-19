package com.project.gmaking.shop.dao;

import com.project.gmaking.shop.vo.ShopProfileVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface ShopProfileDAO {
    // 상단 프로필
    ShopProfileVO selectShopProfile(@Param("userId") String userId);
}
