import { useEffect, useRef } from "react";
import { Client as StompClient } from "@stomp/stompjs";
import SockJS from "sockjs-client";

/**
 * 서버가 convertAndSendToUser("/queue/notifications")로 보내는 알림을 수신
 * onMessage(payload) 콜백에 알림 JSON을 넘겨줌
 */
export default function useNotificationsSocket(onMessage) {
  const clientRef = useRef(null);
  const reconnectRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("gmaking_token");
    if (!token) return;

    const headers = {
      Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
    };

    const client = new StompClient({
      webSocketFactory: () => new SockJS("/notify-ws"),
      connectHeaders: headers,
      debug: () => {},
      onConnect: () => {
        client.subscribe("/user/queue/notifications", (frame) => {
          try {
            const body = JSON.parse(frame.body || "{}");
            onMessage?.(body);
          } catch (e) {
            console.error("알림 파싱 실패", e);
          }
        });
      },
      onStompError: scheduleReconnect,
      onWebSocketClose: scheduleReconnect,
    });

    function scheduleReconnect() {
      if (reconnectRef.current) return;
      reconnectRef.current = setTimeout(() => {
        reconnectRef.current = null;
        client.activate();
      }, 3000);
    }

    clientRef.current = client;
    client.activate();

    return () => {
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }
      try { clientRef.current?.deactivate(); } catch {}
      clientRef.current = null;
    };
  }, [onMessage]);
}
