import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { useAuth } from "../context/AuthContext";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

import axios from "axios";


const BASE_URL = import.meta.env?.VITE_API_BASE || "http://localhost:8080";

const token = localStorage.getItem("gmaking_token");

const AUTH =
  token ? { Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}` } : undefined;

// ===== 이미지 경로 보정(폴백 없음) =====
function toFullImageUrl(raw, { kind } = {}) {
  if (!raw) return null; // 폴백 제거
  if (/^https?:\/\//i.test(raw)) return raw;

  let url = String(raw).trim();
  url = url
    .replace(/^\/?static(?:\.images|\/images)?\//i, "/images/")
    .replace(/^\/?images\//i, "/images/")
    .replace(/^\/?profile\//i, "/images/profile/")
    .replace(/^\/?character\//i, "/images/character/");

  if (!url.startsWith("/")) url = `/${url}`;
  return `${BASE_URL}${url}`;
}

/* ------------------------------------------------------------------ */
/* 간단 API 래퍼 (요청마다 Authorization 인라인 부착)                  */
/* ------------------------------------------------------------------ */
const apiGet = (url, config = {}) =>
  axios.get(url, { ...config, headers: { ...(config.headers || {}), ...(AUTH ? AUTH : {}) } });

const apiPatch = (url, data = null, config = {}) =>
  axios.patch(url, data, { ...config, headers: { ...(config.headers || {}), ...(AUTH ? AUTH : {}) } });

/* 서버 API (필요시 경로 맞춰 수정) */
const getMyPageSummary = (limit = 6) =>
  apiGet(`${BASE_URL}/api/my-page/summary?limit=${encodeURIComponent(limit)}`);

const getCharacterStats = (characterId) =>
  apiGet(`${BASE_URL}/api/characters/${encodeURIComponent(characterId)}/stats`);

/* ------------------------------------------------------------------ */
/* 페이지 컴포넌트                                                    */
/* ------------------------------------------------------------------ */
export default function MyPage() {
  const handlePick = () => {
    alert("뽑으러가기!");
  };

  // 서버 데이터 상태
  const [profile, setProfile] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 로그인(토큰) 여부만 체크
  useEffect(() => {
    if (!token) {
      alert("로그인 정보가 없습니다. 로그인 페이지로 이동합니다.");
      window.location.href = "/login";
    }
  }, []);

  // 마이페이지 데이터 로드
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await getMyPageSummary(6);
        const data = res.data;

        setProfile(data?.profile ?? null);

        const cards = (data?.characters ?? []).map((c) => ({
          id: c.characterId,
          name: c.name,
          grade: c.grade,
          image: toFullImageUrl(c.imageUrl, { kind: "character" }),
          hp: null,
          def: null,
          atk: null,
          critRate: null,
          speed: null,
        }));

        setCharacters(cards);
        setError(null);
      } catch (e) {
        console.error(e);
        setError("마이페이지 데이터를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-200/70 flex items-center justify-center">
        로딩 중...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-200/70 flex items-center justify-center text-red-600">
        {error}
      </div>
    );
  }

  const profileImageUrl = toFullImageUrl(
    profile?.imageUrl || profile?.profileImage || profile?.imageName || profile?.imagePath,
    { kind: "profile" }
  );

  return (
    <div className="min-h-screen bg-gray-200/70 flex flex-col">
      <Header />
      <main className="flex-1">
        <MyMain
          nickname={profile?.nickname ?? "마스터 님"}
          ticketCount={profile?.ticketCount ?? 0}
          profileImageUrl={profileImageUrl}
          onPickClick={handlePick}
          characters={characters}
        />
      </main>
      <Footer />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 메인 섹션                                                           */
/* ------------------------------------------------------------------ */
function MyMain({
  nickname = "마스터 님",
  ticketCount = 5,
  profileImageUrl,
  onPickClick = () => {},
  characters = [],
}) {
  const [selected, setSelected] = useState(null);
  const statCache = useRef(new Map());
  const navigate = useNavigate();

  // 스탯 조회 (VO 키 → 프론트 키로 매핑)
  const fetchStats = async (characterId) => {
    if (statCache.current.has(characterId)) return statCache.current.get(characterId);
    try {
      const { data } = await getCharacterStats(characterId);
      const stats = {
        hp: data.characterHp,
        atk: data.characterAttack,
        def: data.characterDefense,
        speed: data.characterSpeed,
        critRate: data.criticalRate,
      };
      statCache.current.set(characterId, stats);
      return stats;
    } catch (e) {
      console.error(e);
      return { _statsError: "스탯을 불러오지 못했습니다." };
    }
  };

  const onOpenCharacter = async (c) => {
    setSelected({ ...c, _statsLoading: true });
    const stats = await fetchStats(c.id);
    setSelected({ ...c, ...stats, _statsLoading: false });
  };

  const onChat = () => {
    if (selected?.id) navigate(`/chat-entry/${selected.id}`);
    else alert("캐릭터를 먼저 선택하세요!");
  };

  const onGrow = () => alert(`${selected?.name} 성장시키기`);
  const onSend = () => alert(`${selected?.name} 보내기`);

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-8">
      <div className="grid gap-6 md:grid-cols-[minmax(320px,540px),1fr] md:items-stretch">
        {/* 프로필 카드 */}
        <section className="bg-white border-2 border-black rounded-[28px] p-6 w-full h-full">
          <div className="flex items-start gap-6">
            <div className="shrink-0 flex flex-col items-center">
              {/* 폴백 제거: 이미지가 있으면 렌더링 */}
              {profileImageUrl && (
                <img
                  src={profileImageUrl}
                  alt="프로필 이미지"
                  className="w-36 h-36 md:w-44 md:h-44 rounded-full object-cover border border-gray-300 bg-white"
                  onError={(e) => {
                    // 폴백 사용 안 함: 표시만 숨김
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}

              <div className="mt-6 flex items-center gap-5 text-gray-800">
                <NotificationBell />
                <IconMail />
                <MoreMenuInline />
              </div>
            </div>

            <div className="flex-1 pt-2">
              <div className="text-2xl md:text-[28px] font-semibold text-gray-900">
                {nickname}
              </div>
              <div className="mt-2 text-lg md:text-xl text-gray-900 flex items-center gap-2">
                보유 부화권 <span className="font-semibold">{ticketCount}</span>
                <span role="img" aria-label="ticket">🎟️</span>
              </div>
            </div>
          </div>
        </section>

        {selected && (
          <CharacterDetail
            character={selected}
            onGrow={onGrow}
            onChat={onChat}
            onSend={onSend}
          />
        )}
      </div>

      <h2 className="mt-8 mb-4 text-xl md:text-2xl font-semibold text-gray-900">
        내 캐릭터
      </h2>

      <CharacterSection
        characters={characters}
        selectedId={selected?.id}
        onPickClick={onPickClick}
        onOpenCharacter={onOpenCharacter}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 캐릭터 상세 패널                                                    */
/* ------------------------------------------------------------------ */
function CharacterDetail({ character, onGrow, onChat, onSend }) {
  const {
    name,
    grade,
    hp,
    def,
    atk,
    critRate,
    speed,
    _statsLoading,
    _statsError,
  } = character ?? {};
  const fmt = (v) => (v == null ? "-" : `${v}`);

  return (
    <section className="rounded-2xl border border-black/10 bg-gradient-to-b from-gray-100 to-gray-200 p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">
          {fmt(name)}
        </h3>
        <span className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-white px-3 py-1 text-sm font-semibold text-gray-800">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
          등급 {fmt(grade)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-white/80 px-4 py-3 ring-1 ring-gray-200">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">체력</div>
          <div className="mt-1 text-xl md:text-2xl font-extrabold text-gray-900">{fmt(hp)}</div>
        </div>
        <div className="rounded-xl bg-white/80 px-4 py-3 ring-1 ring-gray-200">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">방어력</div>
          <div className="mt-1 text-xl md:text-2xl font-extrabold text-gray-900">{fmt(def)}</div>
        </div>
        <div className="rounded-xl bg-white/80 px-4 py-3 ring-1 ring-gray-200">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">공격력</div>
          <div className="mt-1 text-xl md:text-2xl font-extrabold text-gray-900">{fmt(atk)}</div>
        </div>
        <div className="rounded-xl bg-white/80 px-4 py-3 ring-1 ring-gray-200">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">속도</div>
          <div className="mt-1 text-xl md:text-2xl font-extrabold text-gray-900">{fmt(speed)}</div>
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-white/80 px-4 py-3 ring-1 ring-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">치명타 확률</span>
          <span className="text-xl md:text-2xl font-extrabold text-gray-900">
            {typeof critRate === "number" ? `${critRate}%` : "-"}
          </span>
        </div>
        {typeof critRate === "number" && (
          <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-emerald-500 transition-all"
              style={{ width: `${Math.max(0, Math.min(100, critRate))}%` }}
              aria-label="치명타 확률"
            />
          </div>
        )}
      </div>

      {_statsLoading && (
        <div className="mt-3 rounded-md bg-black/5 px-3 py-2 text-sm text-gray-700">스탯 불러오는 중...</div>
      )}
      {_statsError && (
        <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{_statsError}</div>
      )}

      <div className="mt-6">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onGrow}
            disabled={_statsLoading}
            className="rounded-xl border bg-white px-6 py-3 text-lg font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50 active:bg-gray-100 disabled:opacity-60"
          >
            성장시키기
          </button>
          <button
            onClick={onChat}
            disabled={_statsLoading}
            className="rounded-xl border bg-white px-6 py-3 text-lg font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50 active:bg-gray-100 disabled:opacity-60"
          >
            대화 하기
          </button>
          <button
            onClick={onSend}
            disabled={_statsLoading}
            className="rounded-xl border bg-white px-6 py-3 text-lg font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50 active:bg-gray-100 disabled:opacity-60"
          >
            보내기
          </button>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 내 캐릭터 섹션                                                      */
/* ------------------------------------------------------------------ */
function CharacterSection({ characters = [], selectedId, onPickClick, onOpenCharacter }) {
  const hasCharacters = characters.length > 0;

  if (!hasCharacters) {
    return (
      <section className="rounded-md bg-gray-300 min-h-[340px] flex items-center justify-center">
        <div className="text-center px-6 py-12">
          <div className="text-2xl md:text-3xl text-gray-800 mb-6">내 캐릭터를 뽑아주세요!</div>
          <button
            onClick={onPickClick}
            className="px-8 py-3 rounded bg-white border text-gray-900 text-lg hover:bg-gray-50 active:bg-gray-100 transition"
          >
            뽑으러가기
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-md bg-gray-300 py-6 px-5">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-6">
        {characters.map((c) => (
          <CharacterCard
            key={c.id}
            character={c}
            active={selectedId === c.id}
            onClick={() => onOpenCharacter?.(c)}
          />
        ))}
        <button
          onClick={onPickClick}
          className="aspect-square rounded-2xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 transition"
          aria-label="캐릭터 추가"
        >
          <span className="text-7xl leading-none text-gray-900">+</span>
        </button>
      </div>
    </section>
  );
}

function CharacterCard({ character, active, onClick }) {
  return (
    <div className="select-none">
      <button
        onClick={onClick}
        className={`aspect-square w-full rounded-2xl overflow-hidden bg-white border ${
          active ? "border-sky-400 ring-2 ring-sky-300" : "border-gray-200 hover:border-gray-300"
        } active:scale-[0.99] transition`}
        aria-label={character.name}
      >
        <div className="w-full h-full p-3 flex items-center justify-center">
          {/* 폴백 없음: 이미지 주소가 있으면만 렌더 */}
          {character.image && (
            <img
              src={character.image}
              alt={character.name}
              className="max-h-full max-w-full object-contain"
              onError={(e) => {
                // 폴백 없이 숨김 처리
                e.currentTarget.style.opacity = 0;
              }}
            />
          )}
        </div>
      </button>
      <div className="mt-2 text-lg font-medium text-gray-900">{character.name}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 알림 벨 (axiosInstance 제거, 순수 axios + 인라인 JWT)               */
/* ------------------------------------------------------------------ */
function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [gearOpen, setGearOpen] = useState(false);
  const [tab, setTab] = useState("new"); // 'new' | 'read'
  const [badge, setBadge] = useState(0);
  const [unread, setUnread] = useState([]); // [{id, title, linkUrl, type, status, meta, createdDate}]
  const [read, setRead] = useState([]);
  const [isBulkWorking, setIsBulkWorking] = useState(false);
  const navigate = useNavigate();

  const btnRef = useRef(null);
  const popRef = useRef(null);
  const gearRef = useRef(null);
  /** @type {React.MutableRefObject<Client | null>} */
  const stompRef = useRef(null);
  const startedRef = useRef(false);
  const subRef = useRef(null);

  // ===== REST helpers =====
  const fetchUnreadCount = async () => {
    const { data } = await apiGet(`${BASE_URL}/api/notifications/unread/count`);
    return typeof data?.count === "number" ? data.count : 0;
  };
  const fetchUnread = async ({ limit = 20, offset = 0 } = {}) => {
    const { data } = await apiGet(
      `${BASE_URL}/api/notifications/unread?limit=${encodeURIComponent(limit)}&offset=${encodeURIComponent(offset)}`
    );
    return data;
  };
  const fetchRead = async ({ limit = 20, offset = 0 } = {}) => {
    const { data } = await apiGet(
      `${BASE_URL}/api/notifications/read?limit=${encodeURIComponent(limit)}&offset=${encodeURIComponent(offset)}`
    );
    return data;
  };

  // 읽음 처리 (단건 / 전체)
  const markRead = async (id) => {
    await apiPatch(`${BASE_URL}/api/notifications/${encodeURIComponent(id)}/read`);
  };
  const markAllReadApi = async () => {
    await apiPatch(`${BASE_URL}/api/notifications/read-all`);
  };

  // 소프트 삭제 (STATUS='deleted')
  const softDeleteOne = async (id) => {
    await apiPatch(`${BASE_URL}/api/notifications/${encodeURIComponent(id)}/delete`);
  };
  const softDeleteAllRead = async () => {
    await apiPatch(`${BASE_URL}/api/notifications/read/delete`);
  };

  const normalizeList = (arr) =>
    (arr || []).map((n) => ({
      id: n.id,
      title: n.title || "알림",
      linkUrl: n.linkUrl || null,
      type: n.type,
      status: n.status, // 'unread' | 'read'
      meta: typeof n.metaJson === "string" ? safeJson(n.metaJson) : n.metaJson || {},
      createdDate: n.createdDate,
    }));

  const refreshAll = async () => {
    const [cnt, u, r] = await Promise.all([
      fetchUnreadCount(),
      fetchUnread({ limit: 20, offset: 0 }),
      fetchRead({ limit: 20, offset: 0 }),
    ]);
    setBadge(cnt ?? 0);
    setUnread(normalizeList(u));
    setRead(normalizeList(r));
  };

  // === PVP 결과 모달 상태 ===
  const [pvpOpen, setPvpOpen] = useState(false);
  const [pvpData, setPvpData] = useState(null);

  // 알림→PVP 모달 데이터 가져오기
  const fetchPvpModal = async (notificationId) => {
    const { data } = await apiGet(
      `${BASE_URL}/api/notifications/${encodeURIComponent(notificationId)}/pvp-modal`
    );
    return data;
  };

  // 초기 로드 + STOMP 연결
  useEffect(() => {
    if (!token) return;

    refreshAll().catch(console.error);
    if (startedRef.current) return;
    startedRef.current = true;

    const sockUrl = `${BASE_URL}/notify-ws`;
    const client = new Client({
      webSocketFactory: () => new SockJS(sockUrl),
      connectHeaders: AUTH || {}, // 인라인 헤더
      debug: () => {},
      reconnectDelay: 0,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        subRef.current = client.subscribe("/user/queue/notifications", () => {
          refreshAll().catch(console.error);
        });
      },
      onStompError: (frame) => console.error("STOMP error", frame?.headers, frame?.body),
    });

    client.activate();
    stompRef.current = client;

    return () => {
      try { subRef.current?.unsubscribe(); } catch {}
      subRef.current = null;
      try { stompRef.current?.deactivate(); } catch {}
      stompRef.current = null;
      startedRef.current = false;
    };
  }, []);

  // 알림창 닫기
  useEffect(() => {
    if (!open) return;

    const onDocPointer = (e) => {
      const popEl = popRef.current;
      const btnEl = btnRef.current;
      if (!popEl) return;

      const target = e.target;
      const clickedInsidePop = popEl.contains(target);
      const clickedOnButton = btnEl && btnEl.contains(target);
      if (clickedInsidePop || clickedOnButton) return;

      setOpen(false);
      setGearOpen(false);
    };

    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        setGearOpen(false);
      }
    };

    document.addEventListener("mousedown", onDocPointer);
    document.addEventListener("touchstart", onDocPointer, { passive: true });
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onDocPointer);
      document.removeEventListener("touchstart", onDocPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // “모두 읽음”
  const markAllRead = async () => {
    if (unread.length === 0) return;
    setIsBulkWorking(true);
    try {
      await markAllReadApi();
      await refreshAll();
    } catch (e) {
      console.error(e);
      alert("모두 읽음 처리에 실패했습니다.");
    } finally {
      setIsBulkWorking(false);
    }
  };

  // 개별 알림 클릭(읽음 처리 & 이동/모달)
  const onClickItem = async (n) => {
    try {
      if (n.status !== "read") {
        await markRead(n.id);
      }
      if (n.type === "PVP_RESULT") {
        const data = await fetchPvpModal(n.id);
        setPvpData(data);
        setPvpOpen(true);
      } else if (n.linkUrl) {
        navigate(n.linkUrl);
      }
    } finally {
      await refreshAll().catch(console.error);
    }
  };

  // 읽은 알림 개별 삭제(소프트)
  const onDeleteRead = async (id) => {
    try {
      await softDeleteOne(id);
      setRead((prev) => prev.filter((n) => n.id !== id));
    } catch (e) {
      console.error(e);
      alert("알림 삭제에 실패했습니다.");
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
          <path
            d="M15 17H9m9-1V11a6 6 0 10-12 0v5l-1 2h14l-1-2z"
            stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
        {badge > 0 && (
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
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  tab === "new" ? "bg-gray-200 text-gray-900" : "hover:bg-gray-100"
                }`}
              >
                새 알림
              </button>
              <button
                onClick={() => setTab("read")}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  tab === "read" ? "bg-gray-200 text-gray-900" : "hover:bg-gray-100"
                }`}
              >
                읽은 알림
              </button>
            </div>

            <div className="relative">
              <button
                ref={gearRef}
                onClick={() => setGearOpen((v) => !v)}
                className="p-1.5 rounded hover:bg-gray-100 active:bg-gray-200"
                aria-label="알림 설정"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" stroke="currentColor" strokeWidth="1.6" />
                  <path
                    d="M19 12a7 7 0 01-.1 1.2l2 1.5-2 3.4-2.3-.9a6.9 6.9 0 01-2 .9l-.4 2.4H9.8l-.4-2.4a6.9 6.9 0 01-2 .9l-2.3.9-2-3.4 2-1.5A7 7 0 017 12c0-.4 0-.8.1-1.2l-2-1.5 2-3.4 2.3.9c.6-.4 1.3-.7 2-.9l.4-2.4h3.1l.4 2.4c.7.2 1.4.5 2 .9l2.3-.9 2 3.4-2 1.5c.1.4.1.8.1 1.2z"
                    stroke="currentColor" strokeWidth="1.2"
                  />
                </svg>
              </button>

              {gearOpen && (
                <div className="absolute left-full top-0 ml-2 w-48 rounded-lg border bg-white shadow-lg overflow-hidden z-[60] origin-top-left">
                  <button
                    onClick={async () => {
                      setIsBulkWorking(true);
                      try { await markAllReadApi(); await refreshAll(); }
                      catch (e) { console.error(e); alert("모두 읽음 처리에 실패했습니다."); }
                      finally { setIsBulkWorking(false); setGearOpen(false); }
                    }}
                    disabled={isBulkWorking}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
                  >
                    모두 읽음
                  </button>

                  <button
                    onClick={async () => {
                      if (!window.confirm("읽은 알림을 모두 삭제하시겠습니까?")) return;
                      setIsBulkWorking(true);
                      try { await softDeleteAllRead(); await refreshAll(); }
                      catch (e) { console.error(e); alert("읽은 알림 전체 삭제에 실패했습니다."); }
                      finally { setIsBulkWorking(false); setGearOpen(false); }
                    }}
                    disabled={isBulkWorking}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60"
                  >
                    읽은 알림 전체 삭제
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-auto p-3">
            {(tab === "new" ? unread : read).length === 0 ? (
              <div className="py-16 text-center text-gray-500">
                {tab === "new" ? "새 알림이 없어요" : "읽은 알림이 없어요"}
              </div>
            ) : (
              <ul className="space-y-2">
                {(tab === "new" ? unread : read).map((n) => (
                  <li
                    key={n.id}
                    tabIndex={0}
                    role="button"
                    onClick={() => onClickItem(n)}
                    className="relative group cursor-pointer rounded-md px-3 py-3 border border-gray-200 bg-white transition-colors duration-150 hover:bg-sky-50 hover:border-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                  >
                    <p className="pr-8 text-sm text-gray-900">{n.title}</p>

                    {tab === "read" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteRead(n.id); }}
                        aria-label="알림 삭제"
                        title="알림 삭제"
                        className="absolute right-2 top-2 rounded p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* PVP 결과 모달 */}
      <PvpResultModal
        open={pvpOpen}
        data={pvpData}
        onClose={() => setPvpOpen(false)}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 아이콘/유틸                                                         */
/* ------------------------------------------------------------------ */
function IconMail(props) {
  return (
    <svg width="45" height="45" viewBox="0 0 24 24" fill="none" {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3.5 7l8.5 6 8.5-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MoreMenuInline() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const btnRef = useRef(null);
  const panelRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  const handleEditProfile = () => {
    setOpen(false);
    navigate("/my-page/profile/edit");
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      setOpen(false);
      navigate("/login");
    }
  };

  const updatePosition = () => {
    const btn = btnRef.current;
    const panel = panelRef.current;
    if (!btn || !panel) return;

    const r = btn.getBoundingClientRect();
    const margin = 8;
    const OFFSET_Y = -5;
    const OFFSET_X = 150;

    let pw = panel.offsetWidth;
    let left = r.left + r.width / 2 - pw / 2 + OFFSET_X;
    left = Math.max(margin, Math.min(left, window.innerWidth - pw - margin));
    const top = r.bottom + OFFSET_Y;
    setPos({ top, left, width: pw });

    requestAnimationFrame(() => {
      if (!panelRef.current) return;
      pw = panelRef.current.offsetWidth;
      let l2 = r.left + r.width / 2 - pw / 2 + OFFSET_X;
      l2 = Math.max(margin, Math.min(l2, window.innerWidth - pw - margin));
      setPos((p) => (p.left === l2 && p.top === top ? p : { top, left: l2, width: pw }));
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onResizeScroll = () => updatePosition();
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    const onDown = (e) => {
      const p = panelRef.current;
      const b = btnRef.current;
      if (!p) return;
      if (p.contains(e.target) || b?.contains?.(e.target)) return;
      setOpen(false);
    };

    window.addEventListener("resize", onResizeScroll);
    window.addEventListener("scroll", onResizeScroll, true);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown, { passive: true });
    document.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("resize", onResizeScroll);
      window.removeEventListener("scroll", onResizeScroll, true);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative inline-flex">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="더보기"
        className="rounded-full p-1.5 hover:bg-gray-100 active:bg-gray-200"
      >
        <IconMore />
      </button>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="false"
            className="fixed z-[100] w-64 rounded-2xl bg-white shadow-xl ring-1 ring-black/5 overflow-hidden"
            style={{ top: pos.top, left: pos.left }}
          >
            <div className="absolute -top-2 left-6 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-white drop-shadow" />

            <div className="px-4 py-3 border-b text-sm text-gray-600">더보기</div>
            <div className="p-2">
              <button
                className="w-full text-left rounded-xl px-4 py-3 text-[15px] hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onClick={handleEditProfile}
              >
                회원 정보 수정
              </button>
              <button
                className="mt-1 w-full text-left rounded-xl px-4 py-3 text-[15px] hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onClick={handleLogout}
              >
                로그아웃
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

function IconMore(props) {
  return (
    <svg width="45" height="45" viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="6" cy="12" r="1.7" fill="currentColor" />
      <circle cx="12" cy="12" r="1.7" fill="currentColor" />
      <circle cx="18" cy="12" r="1.7" fill="currentColor" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* PVP 결과 모달                                                       */
/* ------------------------------------------------------------------ */
function PvpResultModal({ open, data, onClose }) {
  const overlayRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const result = data?.result === "WIN" ? "승리" : "패배";
  const opponentNickname = data?.opponentNickname ?? data?.opponentUserId ?? "상대";
  const characterName = data?.opponentCharacterName ?? "-";
  const img = toFullImageUrl(data?.opponentImageUrl, { kind: "character" });

  const stat = (v, suffix = "") => (v == null ? "-" : `${v}${suffix}`);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[1000] bg-black/40 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose?.(); }}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="text-xl font-semibold">전투 결과</h3>
          <button
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm border hover:bg-zinc-50"
          >
            닫기
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 상대 캐릭터 요약: 폴백 없이 주소 있으면만 렌더 */}
          <div className="flex items-center gap-4">
            {img && (
              <img
                src={img}
                alt="상대 캐릭터"
                className="w-20 h-20 rounded-2xl object-cover border bg-white"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            )}
            <div className="min-w-0">
              <div className="text-lg font-semibold truncate">
                {characterName}
                <span className="text-zinc-400 text-base ml-2">({opponentNickname})</span>
              </div>
              <div
                className={`inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-sm
                ${data?.result === "WIN" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
              >
                {result}
              </div>
            </div>
          </div>

          {/* 스탯 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Stat label="LV"  value={stat(data?.level)} />
            <Stat label="HP"  value={stat(data?.hp)} />
            <Stat label="ATK" value={stat(data?.atk)} />
            <Stat label="DEF" value={stat(data?.def)} />
            <Stat label="SPD" value={stat(data?.spd)} />
            <Stat label="CRIT" value={stat(data?.crit, "%")} />
          </div>

          <div className="text-xs text-zinc-500">
            전투 ID: {data?.battleId ?? "-"} · 알림 ID: {data?.notificationId ?? "-"}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border p-3 text-center bg-white/80">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 유틸                                                                */
/* ------------------------------------------------------------------ */
function safeJson(s) {
  try {
    return JSON.parse(s || "{}");
  } catch {
    return {};
  }
}
