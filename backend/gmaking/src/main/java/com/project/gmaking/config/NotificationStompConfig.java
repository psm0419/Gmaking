package com.project.gmaking.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class NotificationStompConfig implements WebSocketMessageBrokerConfigurer {
    private final StompAuthChannelInterceptor stompAuthChannelInterceptor; // 아래 2) 참고

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/notify-ws")                 // 프런트에서 SockJS로 연결할 엔드포인트
                .setAllowedOriginPatterns("*")
                .withSockJS();                      // 필요 없으면 .withSockJS() 제거(순수 WS)
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue"); // 서버 -> 클라 목적지
        registry.setApplicationDestinationPrefixes("/app"); // 클라 -> 서버 (MessageMapping)
        registry.setUserDestinationPrefix("/user");         //개인 큐 프리픽스
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // CONNECT 프레임에서 JWT 인증 → Principal.userId 주입
        registration.interceptors(stompAuthChannelInterceptor);
    }
}
