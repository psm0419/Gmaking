// src/pages/MyPage.jsx
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { useAuth } from "../context/AuthContext";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

// 🔔 분리된 웹알림 컴포넌트
import NotificationBell from "../components/notifications/NotificationBell";

const DEFAULT_PROFILE_IMG = "/images/profile/default.png";

/* ──────────────────────────────────────────────────────────────── */
/* 페이지 스켈레톤                                                   */
/* ──────────────────────────────────────────────────────────────── */
export default function MyPage() {
  return (
    <div className="min-h-screen bg-gray-200/70 flex flex-col">
      <Header />
      <main className="flex-1">
        <MyMain />
      </main>
      <Footer />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────── */
/* 메인                                                             */
/* ──────────────────────────────────────────────────────────────── */
function MyMain() {
  const navigate = useNavigate();

  const [nickname, setNickname] = useState("마스터 님");
  const [ticketCount, setTicketCount] = useState(0);
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [selected, setSelected] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // PVP 모달
  const [pvpModalOpen, setPvpModalOpen] = useState(false);
  const [pvpModalData, setPvpModalData] = useState(null);

  const token = localStorage.getItem("gmaking_token");
  let userId = null;
  if (token) {
    try {
      const raw = token.startsWith("Bearer ") ? token.slice(7) : token;
      const decoded = jwtDecode(raw);
      userId = decoded?.userId ?? null;
    } catch (e) {
      console.error("토큰 디코딩 실패 : ", e);
    }
  }

  // 서버에서 요약 데이터 가져오기
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const headers = {
      Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
    };

    (async () => {
      try {
        setLoading(true);
        const { data } = await axios.get("/api/my-page/summary", {
            headers,
            params: { limit: 50 }, // 7개 이상이면 넉넉히
        });

        const p = data?.profile ?? null;
        setNickname(p?.nickname ?? "마스터 님");
        setTicketCount(p?.ticketCount ?? 0);
        setProfileImageUrl(p?.imageUrl ?? null);

        const cards = (data?.characters ?? []).map((c) => {
          const stat = c.characterStatVO || c.characterStat || null;
          return {
            id: c.characterId ?? c.id,
            name: c.name ?? c.characterName ?? "",
            grade: c.grade ?? c.rarity ?? null,
            imageUrl: c.imageUrl ?? c.image ?? null,
            hp: stat?.hp ?? null,
            attack: stat?.attack ?? null,
            defense: stat?.defense ?? null,
            speed: stat?.speed ?? null,
            criticalRate: stat?.criticalRate ?? null,
            characterStatVO: stat,
          };
        });
        setCharacters(cards);
        setError(null);
      } catch (e) {
        console.error(e);
        setError("마이페이지 데이터를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token, navigate]);

  const onOpenCharacter = (c) => setSelected(c);

  const onChat = () => selected?.id && navigate(`/chat-entry/${selected.id}`);
  const onGrow = () => {};
  const onSend = () => {};
  const onPickClick = () => navigate('/create-character'); // 필요 시 '/gacha' 등으로 이동

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-6 py-20 text-center text-gray-700">
        로딩 중...
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-6xl mx-auto px-6 py-20 text-center text-red-600">
        {error}
      </div>
    );
  }

  const safeProfileSrc = profileImageUrl || DEFAULT_PROFILE_IMG;

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-8">
      <div className="grid gap-6 md:grid-cols-[minmax(320px,540px),1fr] md:items-stretch">
        {/* 프로필 카드 */}
        <section className="bg-white border-2 border-black rounded-[28px] p-6 w-full h-full">
          <div className="flex items-start gap-6">
            <div className="shrink-0 flex flex-col items-center">
              {/* 이미지 주소가 있을 때만 렌더, 에러 시 폴백 */}
              <img
                src={safeProfileSrc}
                alt="프로필 이미지"
                className="w-36 h-36 md:w-44 md:h-44 rounded-full object-cover border border-gray-300 bg-white"
                onError={(e) => {
                  if (e.currentTarget.dataset.fallbackApplied) return;
                  e.currentTarget.dataset.fallbackApplied = "1";
                  e.currentTarget.src = DEFAULT_PROFILE_IMG;
                }}
              />

              <div className="mt-6 flex items-center gap-5 text-gray-800">
                {/* 분리된 컴포넌트 삽입 */}
                <NotificationBell
                  onOpenPvpModal={(data) => {
                    setPvpModalData(data);
                    setPvpModalOpen(true);
                  }}
                />
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

      <h2 className="mt-8 mb-4 text-xl md:text-2xl font-semibold text-gray-900">내 캐릭터</h2>

      <CharacterSection
        characters={characters}
        selectedId={selected?.id}
        onPickClick={onPickClick}
        onOpenCharacter={onOpenCharacter}
      />

      <PvpResultModal
        open={pvpModalOpen}
        data={pvpModalData}
        onClose={() => setPvpModalOpen(false)}
      />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────── */
/* 캐릭터 상세 패널                                                   */
/* ──────────────────────────────────────────────────────────────── */
function CharacterDetail({ character, onGrow, onChat, onSend }) {
  const name = character?.name ?? character?.characterName;
  const grade = character?.grade;
  const hp = character?.hp;
  const def = character?.defense;
  const atk = character?.attack;
  const speed = character?.speed;
  const critRate = character?.criticalRate;
  const _statsLoading = false;
  const _statsError = null;
  const fmt = (v) => (v == null ? "-" : `${v}`);

  return (
    <section className="rounded-2xl border border-black/10 bg-gradient-to-b from-gray-100 to-gray-200 p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">
          {fmt(name)}
        </h3>
        <span className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-white px-3 py-1 text-sm font-semibold text-gray-800">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
          등급 등급 {fmt(grade)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="체력" value={fmt(hp)} />
        <StatCard label="방어력" value={fmt(def)} />
        <StatCard label="공격력" value={fmt(atk)} />
        <StatCard label="속도" value={fmt(speed)} />
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

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl bg-white/80 px-4 py-3 ring-1 ring-gray-200">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-1 text-xl md:text-2xl font-extrabold text-gray-900">{value}</div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────── */
/* 내 캐릭터 섹션                                                     */
/* ──────────────────────────────────────────────────────────────── */
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
          <img
            src={character?.imageUrl}
            alt={character?.name ?? ""}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      </button>
      <div className="mt-2 text-lg font-medium text-gray-900">{character?.name}</div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────── */
/* 아이콘/유틸                                                       */
/* ──────────────────────────────────────────────────────────────── */
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
      await logout?.();
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

/* (선택) PVP 결과 모달 — 스타일 업그레이드 */
function PvpResultModal({ open, data, onClose }) {
  const overlayRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const resultText = data?.result === "WIN" ? "승리" : "패배";
  const badgeCls =
    data?.result === "WIN"
      ? "bg-green-100 text-green-700"
      : "bg-red-100 text-red-700";

  const stat = (v, suffix = "") => (v == null ? "-" : `${v}${suffix}`);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[1000] bg-black/40 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose?.(); }}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
          <h3 className="text-xl font-semibold">전투 결과</h3>
          <button onClick={onClose} className="rounded-full px-3 py-1 text-sm border hover:bg-zinc-50">
            닫기
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-sm ${badgeCls}`}>
              {resultText}
            </div>
            <div className="text-sm text-zinc-500">
              전투 ID: {data?.battleId ?? "-"}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <ModalStat label="LV"  value={stat(data?.level)} />
            <ModalStat label="HP"  value={stat(data?.hp)} />
            <ModalStat label="ATK" value={stat(data?.atk)} />
            <ModalStat label="DEF" value={stat(data?.def)} />
            <ModalStat label="SPD" value={stat(data?.spd)} />
            <ModalStat label="CRIT" value={stat(data?.crit, "%")} />
          </div>

          <div className="text-sm text-zinc-600">
            상대: <b>{data?.opponentNickname ?? "-"}</b>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModalStat({ label, value }) {
  return (
    <div className="rounded-xl border border-zinc-200 p-3 text-center bg-white/90">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
