// STOMP + SockJS 기반 알림 소켓 유틸
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:8080";

/**
 * 사용법:
 * const stop = connectNotifications({
 *   token: localStorage.getItem("accessToken"),
 *   onMessage: (text, frame) => { ... },
 *   onConnect: () => {},
 *   onDisconnect: () => {},
 *   onError: (e) => {},
 * });
 * // 언마운트 시
 * stop();
 */
export function connectNotifications({
  token,
  onMessage,
  onConnect,
  onDisconnect,
  onError,
} = {}) {

  if (!token || !token.trim()) {
    onError?.(new Error("No access token in localStorage"));
    return () => {};
  }

  const client = new Client({
    webSocketFactory: () => new SockJS(`${API_BASE}/notify-ws`),
    connectHeaders: {
      // 서버의 StompAuthChannelInterceptor가 CONNECT 헤더 Authorization을 검사
      Authorization: `Bearer ${token ?? ""}`,
    },
    connectHeaders: {
          Authorization: `Bearer ${token}`,
          authorization: `Bearer ${token}`,
    },
    reconnectDelay: 3000,      // 끊기면 3초 후 자동 재시도
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    debug: () => {},           // 콘솔 로그 끄기
    onConnect: () => {
      // 개인 큐: 서버가 convertAndSendToUser(userId, "/queue/notify", ...) 로 보내면
      // 클라 구독 경로는 반드시 "/user/queue/notify"
      const sub = client.subscribe("/user/queue/notify", (frame) => {
        onMessage?.(frame.body, frame);
      });

      onConnect?.({ client, unsubscribeAll: () => sub.unsubscribe() });
    },
    onStompError: (frame) => {
      onError?.(frame);
    },
    onWebSocketClose: () => {
      onDisconnect?.();
    },
  });

  client.activate();

  // 정리 함수 반환
  return () => {
    try { client.deactivate(); } catch {}
  };
}
