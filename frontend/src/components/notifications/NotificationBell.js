import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useNotificationsSocket from '../../hooks/useNotificationsSocket';
import { notificationsApi as api } from '../../api/notificationApi';

export default function NotificationBell({
  onOpenPvpModal,
  initialCount = 0,         // ✅ 초기 카운트 받기
  token,                    // ✅ 훅/WS에서 필요하면 사용
  onUpdateCount,            // ✅ 카운트 변경시 부모에 알려주기
}) {
  const [open, setOpen] = useState(false);
  const [gearOpen, setGearOpen] = useState(false);
  const [tab, setTab] = useState("new"); // 'new' | 'read'
  const [unread, setUnread] = useState([]);
  const [read, setRead] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [badgeCount, setBadgeCount] = useState(initialCount); // ✅ 뱃지 카운트

  const btnRef = useRef(null);
  const popRef = useRef(null);
  const navigate = useNavigate();

  // initialCount가 바뀌면 반영
  useEffect(() => {
    setBadgeCount(initialCount ?? 0);
  }, [initialCount]);

  // 실시간 수신: unread 리스트 맨 앞에 삽입 + 뱃지 + 부모에 통지
  useNotificationsSocket((payload) => {
    setUnread((prev) => [{ ...payload, status: "unread" }, ...prev]);
    setBadgeCount((c) => {
      const next = (c ?? 0) + 1;
      onUpdateCount?.(next);
      return next;
    });
  }, token); // 훅이 두 번째 인자를 받는다면 token 전달 (무시해도 문제없음)

  // 목록 동기화
  const refreshLists = async () => {
    try {
      setLoading(true);
      setErr(null);
      const [u, r] = await Promise.all([api.unread(), api.read()]);
      setUnread(u ?? []);
      setRead(r ?? []);
      const next = (u ?? []).length;
      setBadgeCount(next);
      onUpdateCount?.(next);
    } catch (e) {
      console.error(e);
      setErr("알림을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 팝업 열릴 때 동기화 + 바깥 클릭 닫기
  useEffect(() => {
    if (!open) return;
    refreshLists();

    const onDocPointer = (e) => {
      const pop = popRef.current;
      const btn = btnRef.current;
      if (!pop) return;
      const t = e.target;
      if (pop.contains(t) || btn?.contains?.(t)) return;
      setOpen(false);
      setGearOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && (setOpen(false), setGearOpen(false));

    document.addEventListener("mousedown", onDocPointer);
    document.addEventListener("touchstart", onDocPointer, { passive: true });
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocPointer);
      document.removeEventListener("touchstart", onDocPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // 동작들
  const badge = badgeCount > 99 ? "99+" : badgeCount; // 보기 좋게 제한 (선택)

  const decBadge = (n = 1) => {
    setBadgeCount((c) => {
      const next = Math.max(0, (c ?? 0) - n);
      onUpdateCount?.(next);
      return next;
    });
  };

  const handleMarkRead = async (id) => {
    // 낙관적 업데이트
    const target = unread.find((n) => n.id === id);
    const nextUnread = unread.filter((n) => n.id !== id);
    setUnread(nextUnread);
    if (target) setRead((p) => [{ ...target, status: "read" }, ...p]);

    // 뱃지 감소
    if (target) decBadge(1);

    try {
      await api.markRead(id);
    } catch (e) {
      console.error(e);
      // 실패 시 목록 재동기화 (뱃지도 함께 정합성 맞춰짐)
      refreshLists();
    }
  };

  const handleOpen = async (n) => {
    await handleMarkRead(n.id);
    if (n.type === "PVP_RESULT" && onOpenPvpModal) {
      try {
        const data = await api.pvpModal(n.id);
        onOpenPvpModal(data);
      } catch (e) {
        console.error(e);
      }
    } else if (n.linkUrl) {
      navigate(n.linkUrl);
    }
  };

  const handleDeleteOne = async (id) => {
    // 삭제 대상이 unread에 있으면 뱃지 감소
    const wasUnread = unread.some((x) => x.id === id);
    setUnread((p) => p.filter((n) => n.id !== id));
    setRead((p) => p.filter((n) => n.id !== id));
    if (wasUnread) decBadge(1);

    try {
      await api.deleteOne(id);
    } catch (e) {
      console.error(e);
      refreshLists();
    }
  };

  const handleMarkAllRead = async () => {
    // 낙관적 처리
    const moved = unread.map((n) => ({ ...n, status: "read" }));
    setRead((p) => [...moved, ...p]);
    setUnread([]);
    // 뱃지 0
    if (badgeCount > 0) decBadge(badgeCount);

    try {
      await api.markAllRead();
    } catch (e) {
      console.error(e);
      refreshLists();
    }
  };

  const handleDeleteAllRead = async () => {
    const prev = read;
    setRead([]);
    try {
      await api.deleteAllRead();
    } catch (e) {
      console.error(e);
      setRead(prev);
    }
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => { setOpen((v) => !v); setGearOpen(false); }}
        className="relative rounded-full p-1.5 hover:bg-gray-100 active:bg-gray-200"
        aria-label="알림 열기"
      >
        <svg width="45" height="45" viewBox="0 0 24 24" fill="none">
          <path d="M15 17H9m9-1V11a6 6 0 10-12 0v5l-1 2h14l-1-2z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {badgeCount > 0 && (
          <span className="absolute -right-1 -top-1 h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[10px] leading-4 text-center">
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div ref={popRef} className="absolute z-50 left-0 top-10 w-[360px] rounded-xl border bg-white shadow-xl">
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTab("new")}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${tab === "new" ? "bg-gray-200 text-gray-900" : "hover:bg-gray-100"}`}
              >
                새 알림
              </button>
              <button
                onClick={() => setTab("read")}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${tab === "read" ? "bg-gray-200 text-gray-900" : "hover:bg-gray-100"}`}
              >
                읽은 알림
              </button>
            </div>

            <div className="relative">
              <button
                onClick={() => setGearOpen((v) => !v)}
                className="p-1.5 rounded hover:bg-gray-100 active:bg-gray-200"
                aria-label="알림 설정"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M19 12a7 7 0 01-.1 1.2l2 1.5-2 3.4-2.3-.9a6.9 6.9 0 01-2 .9l-.4 2.4H9.8l-.4-2.4a6.9 6.9 0 01-2 .9l-2.3.9-2-3.4 2-1.5A7 7 0 017 12c0-.4 0-.8.1-1.2l-2-1.5 2-3.4 2.3.9c.6-.4 1.3-.7 2-.9l.4-2.4h3.1l.4 2.4c.7.2 1.4.5 2 .9l2.3-.9 2 3.4-2 1.5c.1.4.1.8.1 1.2z" stroke="currentColor" strokeWidth="1.2" />
                </svg>
              </button>

              {gearOpen && (
                <div className="absolute right-50 top-8 w-56 rounded-xl border border-zinc-200 bg-white shadow-[0_12px_28px_rgba(0,0,0,0.14)] overflow-hidden z-[60] origin-top-right">
                  <div className="absolute -top-2 right-4 w-0 h-0 border-l-6 border-r-6 border-b-6 border-l-transparent border-r-transparent border-b-white drop-shadow" />
                  <button
                    onClick={handleMarkAllRead}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50"
                  >
                    전체 읽음 처리
                  </button>
                  <button
                    onClick={handleDeleteAllRead}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                  >
                    읽은 알림 전체 삭제
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-auto p-3">
            {loading && <div className="py-8 text-center text-gray-500">불러오는 중…</div>}
            {err && !loading && <div className="py-8 text-center text-red-600">{err}</div>}
            {!loading && !err && (tab === "new" ? unread : read).length === 0 && (
              <div className="py-16 text-center text-gray-500">
                {tab === "new" ? "새 알림이 없어요" : "읽은 알림이 없어요"}
              </div>
            )}
            {!loading && !err && (tab === "new" ? unread : read).length > 0 && (
              <ul className="space-y-2">
                {(tab === "new" ? unread : read).map((n) => (
                  <li
                    key={n.id}
                    tabIndex={0}
                    role="button"
                    onClick={() => handleOpen(n)}
                    className="relative group cursor-pointer rounded-md px-3 py-3 border border-gray-200 bg-white transition-colors duration-150 hover:bg-sky-50 hover:border-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                  >
                    <div className="pr-10">
                      <p className="text-sm text-gray-900">{n.title}</p>
                      {n.message && <p className="mt-1 text-xs text-gray-600">{n.message}</p>}
                      {n.createdDate && (
                        <p className="mt-1 text-[11px] text-gray-400">{String(n.createdDate).replace("T", " ")}</p>
                      )}
                    </div>

                    <div className="absolute right-2 top-2 flex items-center gap-1">
                      {tab === "new" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleMarkRead(n.id); }}
                          aria-label="읽음 처리"
                          title="읽음 처리"
                          className="rounded p-1 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteOne(n.id); }}
                        aria-label="알림 삭제"
                        title="알림 삭제"
                        className="rounded p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
