import { useEffect, useRef } from "react";
import { Client as StompClient } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export default function useNotificationsSocket(onMessage) {
  const clientRef = useRef(null);

  useEffect(() => {
    // 1) 백엔드 BASE URL
    const API_BASE =
      (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE) ||
      process.env.REACT_APP_API_BASE ||
      "http://localhost:8080";

    // 2) 토큰
    const raw = localStorage.getItem("gmaking_token");
    if (!raw) return; // 토큰 없으면 연결 안 함

    const bearer = raw.startsWith("Bearer ") ? raw : `Bearer ${raw}`;
    const tokenParam = encodeURIComponent(raw.replace(/^Bearer\s+/i, ""));

    // 3) SockJS는 http:// 로
    const sockUrl = `${API_BASE}/notify-ws?token=${tokenParam}`;

    // 4) STOMP 클라이언트
    const client = new StompClient({
      webSocketFactory: () => new SockJS(sockUrl),
      connectHeaders: { Authorization: bearer },
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: () => {},
      onConnect: () => {
        client.subscribe("/user/queue/notifications", (frame) => {
          try {
            const data = frame && frame.body ? JSON.parse(frame.body) : {};
            if (typeof onMessage === "function") onMessage(data);
          } catch (e) {
            console.error("알림 JSON 파싱 실패", e);
          }
        });
      },
      onStompError: (frame) => {
        console.warn("STOMP ERROR:", frame?.headers?.message, frame?.body);
      },
      onWebSocketClose: (evt) => {
        console.warn("WebSocket closed:", evt && evt.code, evt && evt.reason);
      },
    });

    clientRef.current = client;
    client.activate();

    return () => {
      try { clientRef.current && clientRef.current.deactivate(); } catch {}
      clientRef.current = null;
    };
  }, [onMessage]);
}
