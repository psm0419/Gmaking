// com/project/gmaking/shop/service/IamportClient.java
package com.project.gmaking.shop.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.atomic.AtomicReference;

@Slf4j
@Component
@RequiredArgsConstructor
public class IamportClient {

    private final @Qualifier("iamportWebClient") WebClient iamportWebClient; // ★ Qualifier 지정

    @Value("${iamport.api.key}")
    private String apiKey;

    @Value("${iamport.api.secret}")
    private String apiSecret;

    // 토큰 캐시
    private final AtomicReference<String> cachedToken = new AtomicReference<>();
    private volatile long tokenExpiryEpochSec = 0L; // expired_at (epoch seconds)

    /** 외부에서 결제 단건 조회 */
    public IamportPayment getPayment(String impUid) {
        String token = ensureAccessToken();
        try {
            IamportCommonResponse<IamportPayment> res =
                    iamportWebClient.get()
                            .uri(uri -> uri.path("/payments/{imp_uid}").build(impUid))
                            .headers(h -> h.setBearerAuth(token))
                            .accept(MediaType.APPLICATION_JSON)
                            .retrieve()
                            .bodyToMono(new ParameterizedTypeReference<IamportCommonResponse<IamportPayment>>() {}) // ★ 수정
                            .block();

            if (res == null) throw new PaymentRemoteException("Null response from Iamport");
            if (res.getCode() != 0) {
                throw new PaymentRemoteException("Iamport getPayment error: code=" + res.getCode() + ", msg=" + res.getMessage());
            }

            IamportPayment p = res.getResponse();
            if (p == null) throw new PaymentRemoteException("Iamport getPayment: response is null");
            return p;
        } catch (Exception e) {
            throw new PaymentRemoteException("Iamport getPayment failed: " + e.getMessage(), e);
        }
    }

    /** AccessToken 보장 */
    private synchronized String ensureAccessToken() {
        long now = Instant.now().getEpochSecond();
        // 유효 기간 10초 전이면 재발급
        if (cachedToken.get() != null && now < (tokenExpiryEpochSec - 10)) {
            return cachedToken.get();
        }
        // 신규 발급
        try {
            IamportCommonResponse<TokenResponse> res =
                    iamportWebClient.post()
                            .uri("/users/getToken")
                            .contentType(MediaType.APPLICATION_JSON)
                            .accept(MediaType.APPLICATION_JSON)
                            .bodyValue(Map.of("imp_key", apiKey, "imp_secret", apiSecret))
                            .retrieve()
                            .bodyToMono(new ParameterizedTypeReference<IamportCommonResponse<TokenResponse>>() {}) // ★ 수정
                            .block();

            if (res == null) throw new PaymentRemoteException("Null token response");
            if (res.getCode() != 0) {
                throw new PaymentRemoteException("Iamport getToken error: code=" + res.getCode() + ", msg=" + res.getMessage());
            }

            TokenResponse token = res.getResponse();
            if (token == null || token.getAccessToken() == null) { // ★ 카멜 이름 사용
                throw new PaymentRemoteException("Iamport getToken: invalid token payload");
            }

            cachedToken.set(token.getAccessToken()); // ★ 카멜 이름 사용
            // expired_at: epoch seconds
            long expiredAt = Objects.requireNonNullElse(token.getExpiredAt(), now + 3600L); // ★ 카멜 이름 사용
            tokenExpiryEpochSec = expiredAt;

            log.debug("[Iamport] token issued, exp={}", expiredAt);
            return cachedToken.get();
        } catch (Exception e) {
            throw new PaymentRemoteException("Iamport getToken failed: " + e.getMessage(), e);
        }
    }

    /* DTO 최소 구조 */

    /** Iamport 공통 래핑 { code, message, response } */
    @Data
    public static class IamportCommonResponse<T> {
        private int code;          // 0 성공
        private String message;    // 실패 시 메시지
        private T response;        // 성공 시 payload
    }

    /** 토큰 응답(response) */
    @Data
    public static class TokenResponse {
        @JsonProperty("access_token")
        private String accessToken;

        private Long now; // epoch seconds

        @JsonProperty("expired_at")
        private Long expiredAt; // epoch seconds
    }

    /** 결제 조회(response)에서 쓰는 최소 필드만 */
    @Data
    public static class IamportPayment {
        private String status; // "paid" 등

        @JsonProperty("merchant_uid")
        private String merchantUid;

        @JsonProperty("imp_uid")
        private String impUid;

        private BigDecimal amount; // 결제 금액

        @JsonProperty("pg_provider")
        private String pgProvider;

        @JsonProperty("pay_method")
        private String payMethod;
    }
}