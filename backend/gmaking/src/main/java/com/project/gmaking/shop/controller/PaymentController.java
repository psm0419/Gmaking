package com.project.gmaking.shop.controller;
import com.project.gmaking.shop.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    /** 결제 준비 */
    @PostMapping("/prepare")
    public Map<String, Object> prepare(Authentication auth,
                                       @RequestParam("productId") int productId,
                                       @RequestParam(value = "quantity", required = false, defaultValue = "1") int quantity) {
        String userId = auth.getName();
        return paymentService.prepare(userId, productId, quantity);
    }

    /** 결제 검증/지급 */
    @PostMapping("/confirm")
    public Map<String, Object> confirm(Authentication auth,
                                       @RequestParam("impUid") String impUid,
                                       @RequestParam("merchantUid") String merchantUid) {
        String userId = auth.getName();
        return paymentService.confirm(userId, impUid, merchantUid);
    }
}