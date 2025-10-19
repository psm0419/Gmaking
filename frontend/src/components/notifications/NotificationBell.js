import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useNotificationsSocket from "../../hooks/useNotificationsSocket";
import { notificationsApi as api } from "../../api/notificationApi";

export default function NotificationBell({
  onOpenPvpModal,          // 있어도 되고 없어도 됨 (내부에서 모달 열어줌)
  initialCount = 0,
  token,
  onUpdateCount,
}) {
  const [open, setOpen] = useState(false);
  const [gearOpen, setGearOpen] = useState(false);
  const [tab, setTab] = useState("new"); // 'new' | 'read'
  const [unread, setUnread] = useState([]);
  const [read, setRead] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [badgeCount, setBadgeCount] = useState(initialCount);

  // ✅ PVP 모달 로컬 상태
  const [pvpOpen, setPvpOpen] = useState(false);
  const [pvpData, setPvpData] = useState(null);

  const btnRef = useRef(null);
  const popRef = useRef(null);
  const navigate = useNavigate();

  // --- utils ---
  const fmtDate = (v) => {
    try {
      const d = typeof v === "string" ? new Date(v) : v;
      if (!(d instanceof Date) || isNaN(d)) return "";
      const pad = (n) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return "";
    }
  };

  // metaJson robust flattener (서버 평탄화 필드 우선)
  function normalizePvpModal(raw) {
    const parseMeta = () => {
      try {
        const v = raw?.metaJson ?? raw?.metaJSON ?? raw?.meta;
        if (!v) return {};
        if (typeof v === "string") return JSON.parse(v);
        return v;
      } catch {
        return {};
      }
    };
    const meta = parseMeta();

    const getPath = (obj, path) => {
      try { return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj); }
      catch { return undefined; }
    };

    const candidates = [
      "opponent.character.stats",
      "opponent.stats",
      "opponent",
      "enemy.stats",
      "enemy",
      "target.stats",
      "target",
      "opponentCharacter.stats",
      "opponentStatus",
    ];
    let found = {};
    for (const p of candidates) {
      const v = getPath(meta, p);
      if (v && typeof v === "object") { found = v; break; }
    }

    const normalizeNum = (x) => {
      if (x == null) return null;
      const n = Number(x);
      return Number.isFinite(n) ? n : null;
    };
    const pick = (o, keys) => { for (const k of keys) if (o?.[k] != null) return o[k]; return null; };

    const level = normalizeNum(raw?.level ?? pick(found, ["level","lv","LEVEL","LV"]));
    const hp    = normalizeNum(raw?.hp    ?? pick(found, ["hp","HP","health","Health"]));
    const atk   = normalizeNum(raw?.atk   ?? pick(found, ["atk","ATK","attack","Attack"]));
    const def   = normalizeNum(raw?.def   ?? pick(found, ["def","DEF","defense","Defense"]));
    const spd   = normalizeNum(raw?.spd   ?? pick(found, ["spd","SPD","speed","Speed"]));
    const crit  = normalizeNum(raw?.crit  ?? pick(found, ["crit","CRIT","critical","Critical","critRate","crit_rate"]));

    return {
      battleId: raw?.battleId ?? null,
      result: raw?.result ?? (raw?.isWinYn === "Y" ? "WIN" : raw?.isWinYn === "N" ? "LOSE" : null),
      opponentUserId: raw?.opponentUserId ?? null,
      opponentNickname: raw?.opponentNickname ?? null,
      opponentCharacterId: raw?.opponentCharacterId ?? null,
      opponentCharacterName: raw?.opponentCharacterName ?? null,
      opponentImageUrl: raw?.opponentImageUrl ?? meta?.opponentImageUrl ?? null, // 메타 백업
      level, hp, atk, def, spd, crit,
    };
  }

  // initialCount 반영
  useEffect(() => {
    setBadgeCount(initialCount ?? 0);
  }, [initialCount]);

  // 실시간 수신: 중복 가드 + 뱃지 증가
  useNotificationsSocket(
    (payload) => {
      setUnread((prev) => {
        const id = payload?.id ?? payload?.notificationId;
        if (id && prev.some((n) => n.id === id)) return prev;
        return [{ ...payload, id, status: "unread" }, ...prev];
      });
      setBadgeCount((c) => {
        const next = (c ?? 0) + 1;
        onUpdateCount?.(next);
        return next;
      });
    },
    token
  );

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

  // 팝업 열기 시 동기화 + 바깥 클릭 닫기
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

    const touchOptions = { passive: true };
    document.addEventListener("mousedown", onDocPointer);
    document.addEventListener("touchstart", onDocPointer, touchOptions);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocPointer);
      document.removeEventListener("touchstart", onDocPointer, touchOptions);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // 뱃지
  const badge = badgeCount > 99 ? "99+" : badgeCount;

  const decBadge = (n = 1) => {
    setBadgeCount((c) => {
      const next = Math.max(0, (c ?? 0) - n);
      onUpdateCount?.(next);
      return next;
    });
  };

  const handleMarkRead = async (id) => {
    const target = unread.find((n) => n.id === id);
    const nextUnread = unread.filter((n) => n.id !== id);
    setUnread(nextUnread);
    if (target) setRead((p) => [{ ...target, status: "read" }, ...p]);
    if (target) decBadge(1);

    try {
      await api.markRead(id);
    } catch (e) {
      console.error(e);
      // 서버 에러일 때만 강복구
      if (!e?.response || e.response.status >= 500) {
        refreshLists();
      }
    }
  };

  const handleOpen = async (n) => {
    await handleMarkRead(n.id);

    if (n.type === "PVP_RESULT") {
      try {
        const raw = await api.pvpModal(n.id);
        console.log("[PVP raw]", raw);
        console.log("[PVP metaJson]", raw?.metaJson); // 없을 수도 있음 (정상)
        const data = normalizePvpModal(raw);

        // A) 부모 콜백도 있으면 호출 (선택)
        onOpenPvpModal?.(data);

        // B) 내부 모달도 항상 열어줌 (확실히 뜨도록)
        setPvpData(data);
        setPvpOpen(true);
      } catch (e) {
        console.error(e);
      }
    } else if (n.linkUrl) {
      navigate(n.linkUrl);
    }
  };

  const handleDeleteOne = async (id) => {
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
    const moved = unread.map((n) => ({ ...n, status: "read" }));
    setRead((p) => [...moved, ...p]);
    setUnread([]);
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
        onClick={() => {
          setOpen((v) => !v);
          setGearOpen(false);
        }}
        className="relative rounded-full p-1.5 hover:bg-gray-100 active:bg-gray-200"
        aria-label="알림 열기"
      >
        <svg width="45" height="45" viewBox="0 0 24 24" fill="none">
          <path
            d="M15 17H9m9-1V11a6 6 0 10-12 0v5l-1 2h14l-1-2z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {badgeCount > 0 && (
          <span className="absolute -right-1 -top-1 h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[10px] leading-4 text-center">
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={popRef}
          className="absolute z-50 left-0 top-10 w-[360px] rounded-xl border bg-white shadow-xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="notif-title"
        >
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
                  <path
                    d="M19 12a7 7 0 01-.1 1.2l2 1.5-2 3.4-2.3-.9a6.9 6.9 0 01-2 .9l-.4 2.4H9.8l-.4-2.4a6.9 6.9 0 01-2 .9l-2.3.9-2-3.4 2-1.5A7 7 0 017 12c0-.4 0-.8.1-1.2l-2-1.5 2-3.4 2.3.9c.6-.4 1.3-.7 2-.9l.4-2.4h3.1l.4 2.4c.7.2 1.4.5 2 .9l2.3-.9 2 3.4-2 1.5c.1.4.1.8.1 1.2z"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  />
                </svg>
              </button>

              {gearOpen && (
                <div className="absolute right-55 top-8 w-56 rounded-xl border border-zinc-200 bg-white shadow-[0_12px_28px_rgba(0,0,0,0.14)] overflow-hidden z-[60] origin-top-right">
                  <div className="absolute -top-2 right-4 w-0 h-0 border-l-6 border-r-6 border-b-6 border-l-transparent border-r-transparent border-b-white drop-shadow" />
                  <button onClick={handleMarkAllRead} className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50">
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
            <h2 id="notif-title" className="sr-only">알림</h2>
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
                        <p className="mt-1 text-[11px] text-gray-400">{fmtDate(n.createdDate)}</p>
                      )}
                    </div>

                    <div className="absolute right-2 top-2 flex items-center gap-1">
                      {tab === "new" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkRead(n.id);
                          }}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteOne(n.id);
                        }}
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
