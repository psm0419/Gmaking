package com.project.gmaking.config;

import com.project.gmaking.debate.websocket.DebateWebSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

import com.project.gmaking.pve.websocket.BattleWebSocketHandler;
import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {

    private final BattleWebSocketHandler battleWebSocketHandler;
    private final DebateWebSocketHandler debateWebSocketHandler;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(battleWebSocketHandler, "/battle")
                .setAllowedOrigins("http://localhost:3000");
        registry.addHandler(debateWebSocketHandler, "/debate")
                .setAllowedOrigins("http://localhost:3000");
    }
}
