import { useEffect, useRef } from "react";
import axiosInstance from "../api/mypage/axiosInstance";

// (선택) 공통 헤더 생성 – axios 인셉터를 쓰고 있으면 생략해도 됨
function buildAuthHeader() {
  const raw = localStorage.getItem("gmaking_token");
  if (!raw) return {};
  return { Authorization: raw.startsWith("Bearer ") ? raw : `Bearer ${raw}` };
}

export default function useChatExit(currentId) {
  const lastIdRef = useRef(currentId || null);        // 마지막 활성 캐릭터
  const prevIdRef = useRef(currentId || null);        // 직전 캐릭터(변경 감지용)
  const mountedRef = useRef(false);
  const isUnloadingRef = useRef(false);
  const devSkipFirstCleanupRef = useRef(true);        // StrictMode cleanup 무시

  // 1) 캐릭터 전환 감지 → 이전 캐릭터에 대해 exit
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      prevIdRef.current = currentId || null;
      lastIdRef.current = currentId || null;
      return;
    }
    const prev = prevIdRef.current;
    const next = currentId || null;

    // prev → next 로 바뀌는 타이밍에 prev에 대해 exit
    if (prev && prev !== next) {
      axiosInstance
        .post(`/api/chat/${prev}/exit`, {}, { headers: buildAuthHeader() })
        .catch(() => {});
    }

    prevIdRef.current = next;
    lastIdRef.current = next;
  }, [currentId]);

  // 2) 탭 종료/숨김 시 keepalive POST
  useEffect(() => {
    const sendKeepalive = () => {
      const cid = lastIdRef.current;
      if (!cid) return;
      isUnloadingRef.current = true;
      try {
        fetch(`/api/chat/${cid}/exit`, {
          method: "POST",
          headers: buildAuthHeader(),
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

  // 3) 컴포넌트 언마운트 시 exit (라우팅 전환 등)
  useEffect(() => {
    return () => {
      if (import.meta?.env?.DEV && devSkipFirstCleanupRef.current) {
        devSkipFirstCleanupRef.current = false; // StrictMode 첫 cleanup 무시
        return;
      }
      if (isUnloadingRef.current) return;

      const cid = lastIdRef.current;
      if (!cid) return;
      axiosInstance
        .post(`/api/chat/${cid}/exit`, {}, { headers: buildAuthHeader() })
        .catch(() => {});
    };
  }, []);
}
