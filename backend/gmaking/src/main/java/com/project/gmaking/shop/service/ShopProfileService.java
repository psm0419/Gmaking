package com.project.gmaking.shop.service;

import com.project.gmaking.shop.dao.ShopProfileDAO;
import com.project.gmaking.shop.vo.ShopProfileVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class ShopProfileService {
    private final ShopProfileDAO shopProfileDAO;

     public ShopProfileVO getShopProfile(String userId) {
         
         ShopProfileVO profile = shopProfileDAO.selectShopProfile(userId);
         if (profile == null) {
             // 필요 시 null 반환으로 바꿔도 됨
             throw new IllegalStateException("Shop profile not found for userId=" + userId);
         }
         return profile;
     }
}
