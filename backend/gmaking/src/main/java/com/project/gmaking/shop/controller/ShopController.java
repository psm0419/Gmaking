package com.project.gmaking.shop.controller;

import com.project.gmaking.shop.service.ShopProfileService;
import com.project.gmaking.shop.vo.ShopProfileVO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/shop")
@RequiredArgsConstructor
public class ShopController {
    private final ShopProfileService shopProfileService;

    @GetMapping("/profile/me")
    public ShopProfileVO getMyProfile(Authentication authentication) {
        String userId = (authentication != null) ? authentication.getName() : null;
        return shopProfileService.getShopProfile(userId);
    }
}
