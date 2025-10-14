// hooks/useChatExit.js
import { useEffect, useRef } from "react";
import axiosInstance from "../api/axiosInstance";

const API_BASE =
  (axiosInstance.defaults?.baseURL && axiosInstance.defaults.baseURL.replace(/\/$/, "")) ||
  (import.meta.env?.VITE_API_BASE || "http://localhost:8080");

export default function useChatExit(currentId) {
  const lastIdRef = useRef(currentId || null);
  const isUnloadingRef = useRef(false);
  const devSkipFirstCleanupRef = useRef(true); // StrictMode 1차 cleanup 무시

  // 현재 캐릭터 ID 최신화
  useEffect(() => {
    if (currentId) lastIdRef.current = currentId;
  }, [currentId]);

  // 탭 종료/새로고침/백그라운드 전환 → keepalive fetch
  useEffect(() => {
    const sendKeepalive = () => {
      const cid = lastIdRef.current;
      if (!cid) return;
      isUnloadingRef.current = true;

      // 필요한 경우 토큰 헤더 추가
      const token = localStorage.getItem("accessToken");
      try {
        fetch(`${API_BASE}/api/chat/${cid}/exit`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          keepalive: true,
        });
      } catch {}
    };

    const onBeforeUnload = () => sendKeepalive();
    const onPageHide = () => sendKeepalive();
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") sendKeepalive();
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  // 컴포넌트 언마운트(라우팅 전환) 시 exit (언로드 중이면 skip)
  useEffect(() => {
    return () => {
      if (import.meta?.env?.DEV && devSkipFirstCleanupRef.current) {
        devSkipFirstCleanupRef.current = false;
        return;
      }
      if (isUnloadingRef.current) return; // 탭 종료 케이스는 위에서 처리됨
      const cid = lastIdRef.current;
      if (!cid) return;

      axiosInstance.post(`/chat/${cid}/exit`).catch(() => {});
    };
  }, []);
}
