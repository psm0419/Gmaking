package com.project.gmaking.config;

import com.project.gmaking.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.List;


@Component
@RequiredArgsConstructor
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor acc = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (acc != null && StompCommand.CONNECT.equals(acc.getCommand())) {
            // 1) Authorization / authorization 모두 조회
            String auth = acc.getFirstNativeHeader("Authorization");
            if (auth == null) auth = acc.getFirstNativeHeader("authorization");

            // 2) (옵션) Handshake 인터셉터가 심어둔 세션 속성에서 백업
            if ((auth == null || !auth.startsWith("Bearer ")) && acc.getSessionAttributes() != null) {
                Object t = acc.getSessionAttributes().get("token"); // 아래 2)에서 넣어줌
                if (t instanceof String s && !s.isBlank()) auth = "Bearer " + s;
            }

            if (auth == null || !auth.startsWith("Bearer ")) {
                throw new IllegalArgumentException("Missing Bearer token");
            }
            String token = auth.substring(7);
            if (token.isBlank()) {
                throw new IllegalArgumentException("Empty Bearer token");
            }

            String userId = jwtTokenProvider.getUserIdFromToken(token);
            acc.setUser(new UsernamePasswordAuthenticationToken(userId, null, List.of()));
        }
        return message;
    }

    /// npm i @stomp/stompjs sockjs-client 설치필수

}
