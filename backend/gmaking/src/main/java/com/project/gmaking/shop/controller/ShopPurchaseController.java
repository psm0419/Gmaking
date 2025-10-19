package com.project.gmaking.shop.controller;

import com.project.gmaking.shop.service.ShopPurchaseService;
import com.project.gmaking.shop.vo.PurchaseRequestVo;
import com.project.gmaking.shop.vo.ShopProfileVO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/shop")
@RequiredArgsConstructor
public class ShopPurchaseController {
    private final ShopPurchaseService shopPurchaseService;

    @PostMapping("/purchase")
    public ShopProfileVO purchase(@RequestBody PurchaseRequestVo req,
                                  Authentication authentication) {

        String userId = (authentication != null) ? authentication.getName() : null;
        if (userId == null || userId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "login required");
        }
        if (req == null || req.getProductId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "productId is required");
        }

        return shopPurchaseService.purchase(userId, req);
    }
}
