import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { useAuth } from "../context/AuthContext";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { notificationsApi } from "../api/notificationApi";

// 분리된 웹알림 컴포넌트 + 분리된 PVP 결과 모달
import NotificationBell from "../components/notifications/NotificationBell";
import PvpResultModal from "../components/notifications/PvpResultModal"; // ← 경로 확인

import GrowthModal from "./GrowthModal";

const DEFAULT_PROFILE_IMG = "/images/profile/default.png";

/* ──────────────────────────────────────────────────────────────── */
/* 페이지 스켈레톤                                                   */
/* ──────────────────────────────────────────────────────────────── */
export default function MyPage() {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
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
  const { user } = useAuth();
  const { updateRepresentativeCharacter } = useAuth();

  const [nickname, setNickname] = useState("마스터 님");
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [selected, setSelected] = useState(null);
  const [repId, setRepId] = useState(null);

  const [isGrowthModalOpen, setIsGrowthModalOpen] = useState(false);
  const [isGrowing, setIsGrowing] = useState(false);
  
  const incubatorCount = Number.isFinite(Number(user?.incubatorCount))
    ? Number(user.incubatorCount)
    : 0;
  const isAdFree = !!user?.isAdFree;

  // 알림
  const [unreadCount, setUnreadCount] = useState(0);

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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 서버에서 요약 데이터 가져오기
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const headers = {
      Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    (async () => {
      try {
        setLoading(true);
        const { data } = await axios.get("/api/my-page/summary", {
          headers,
          params: { limit: 50 },
        });

        const p = data?.profile ?? null;
        setNickname(p?.nickname ?? "마스터 님");
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

        // 대표 캐릭터 조회
        try {
          const rep = await axios.get("/api/my-page/representative-character", {
            headers,
          });
          setRepId(rep?.data?.characterId ?? null);
        } catch (e) {
          console.warn("대표 캐릭터 조회 실패", e);
        }

        // 초기 알림 개수 조회
        try {
          const n = await notificationsApi.count();
          setUnreadCount(Number(n ?? 0));
        } catch (e) {
          console.warn("초기 알림 개수 조회 실패", e);
        }
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
  const onGrow = () => { if(selected?.id){ setIsGrowthModalOpen(true)}};
  const onSend = () => {};
  const onPickClick = () => navigate("/create-character");

  const setRepresentative = async (characterId) => {
    if (!characterId) return;

    try {
      const headers = {
        Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      await axios.patch(
        "/api/my-page/representative-character",
        { characterId },
        { headers }
      );

      const selectedChar = characters.find((c) => c.id === characterId);
      const updatedCharacterImageUrl = selectedChar?.imageUrl || null;

      // 먼저 repId 상태 갱신
      setRepId(characterId);

      // AuthContext와 localStorage 갱신
      updateRepresentativeCharacter(updatedCharacterImageUrl, characterId);
    } catch (e) {
      alert(e?.response?.data?.message || "대표 캐릭터 설정에 실패했습니다.");
    }
  };

  const clearRepresentative = async () => {
    try {
      const headers = {
        Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      await axios.delete("/api/my-page/representative-character", { headers });
      setRepId(null);
    } catch (e) {
      alert(e?.response?.data?.message || "대표 캐릭터 해제에 실패했습니다.");
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-6 py-20 text-center text-white">
        로딩 중...
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-6xl mx-auto px-6 py-20 text-center text-red-400">
        {error}
      </div>
    );
  }

  const safeProfileSrc = profileImageUrl || DEFAULT_PROFILE_IMG;

  const handleConfirmGrowth = async () => {
    if (!selected?.id || isGrowing || incubatorCount <= 0) return;

    setIsGrowing(true); // 로딩 시작
    try {
        const headers = {
            Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
            "Content-Type": "application/json",
        };

        // TODO: 실제 백엔드 API 호출로 대체해야 합니다!
        console.log(`[API Call Mock] Submitting growth job for character ${selected.id}...`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 대기 Mock

        alert(`${selected.name}의 성장 작업이 시작되었습니다! (백엔드 연결 필요)`);
        
        // 성공 후 상태 정리
        setIsGrowthModalOpen(false);
        // TODO: 마이페이지 데이터 및 부화권 개수 새로고침 로직 필요 (예: fetchSummaryData())

    } catch (e) {
        alert(e?.response?.data?.message || "캐릭터 성장에 실패했습니다.");
    } finally {
        setIsGrowing(false); // 로딩 종료
    }
};

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-8">
      {/* A안 적용: items-stretch (모든 브레이크포인트), 왼쪽 카드 h-full + min-h */}
      <div className="grid gap-6 md:grid-cols-[minmax(320px,540px),1fr] items-stretch">
        {/* 프로필 카드 */}
        <section
          className="bg-gray-800 border-2 border-[#FFC700] rounded-[16px] p-6 w-full shadow-lg
                     h-full min-h-[300px] sm:min-h-[360px] md:min-h-[360px]"
        >
          {/* ⛳ 행 전체를 카드 높이에 맞추고 세로 중앙 정렬 */}
          <div className="h-full flex">
            <div className="flex w-full gap-6 items-center">
              {/* ← items-center: 행 자체를 수직 가운데로 */}

              {/* 왼쪽: 프로필 + 아이콘 (세로 가운데 정렬) */}
              <div className="shrink-0 h-full flex flex-col items-center justify-center">
                <img
                  src={safeProfileSrc}
                  alt="프로필 이미지"
                  className="w-36 h-36 md:w-44 md:h-44 rounded-full object-cover border border-[#FFC700] bg-black/50"
                  onError={(e) => {
                    if (e.currentTarget.dataset.fallbackApplied) return;
                    e.currentTarget.dataset.fallbackApplied = "1";
                    e.currentTarget.src = DEFAULT_PROFILE_IMG;
                  }}
                />

                <div className="mt-6 flex items-center gap-5 text-white/90">
                  <NotificationBell
                    initialCount={unreadCount}
                    token={token}
                    onUpdateCount={(n) => setUnreadCount(n)}
                    onOpenPvpModal={(data) => {
                      setPvpModalData(data);
                      setPvpModalOpen(true);
                    }}
                  />
                  <IconMail className="w-10 h-10" />
                  <MoreMenuInline />
                </div>
              </div>

              {/* 오른쪽: 텍스트/배지 영역 (세로 가운데 정렬) */}
              <div className="flex-1 h-full flex flex-col justify-center text-white">
                <div className="text-2xl md:text-[28px] font-bold text-white">
                  {nickname}
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between rounded-lg bg-gray-700/70 p-4 shadow-inner border border-gray-700">
                    <span className="text-base font-semibold text-white/90">보유 부화권</span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-extrabold text-[#FFC700] drop-shadow-md">{incubatorCount}</span>
                      <span role="img" aria-label="ticket" className="text-xl">🎟️</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-gray-700/70 p-4 shadow-inner border border-gray-700">
                    <span className="text-base font-semibold text-white/90">광고 시청 면제</span>
                    {isAdFree ? (
                      <span className="rounded-full bg-emerald-600 px-3 py-1 text-sm font-bold text-white shadow-sm">AD-FREE</span>
                    ) : (
                      <span className="rounded-full bg-red-600 px-3 py-1 text-sm font-bold text-white shadow-sm">광고 시청</span>
                    )}
                  </div>
                </div>
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
            isGrowing={isGrowing}
          />
        )}
      </div>

      <h2 className="mt-8 mb-4 text-xl md:text-2xl font-bold text-white">
        내 캐릭터
      </h2>

      <CharacterSection
        characters={characters}
        selectedId={selected?.id}
        onPickClick={onPickClick}
        onOpenCharacter={onOpenCharacter}
        repId={repId}
        onSetRep={setRepresentative}
        onClearRep={clearRepresentative}
      />

      {/* 분리된 PVP 결과 모달 사용 */}
      <PvpResultModal
        open={pvpModalOpen}
        data={pvpModalData}
        onClose={() => setPvpModalOpen(false)}
      />

      {/* 성장 모달 추가 */}
      <GrowthModal 
        open={isGrowthModalOpen}
        characterName={selected?.name}
        incubatorCount={incubatorCount}
        isGrowing={isGrowing}
        onConfirm={handleConfirmGrowth}
        onClose={() => {
            if (!isGrowing) {
                setIsGrowthModalOpen(false);
            }
        }}
      />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────── */
/* 캐릭터 상세 패널                                                  */
/* ──────────────────────────────────────────────────────────────── */
function CharacterDetail({ character, onGrow, onChat, onSend, isGrowing }) {
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
    <section className="rounded-2xl border border-[#FFC700]/50 bg-gray-800 p-6 shadow-xl">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
          {fmt(name)}
        </h3>
        <span className="inline-flex items-center gap-1 rounded-full border border-gray-600 bg-gray-900 px-3 py-1 text-sm font-semibold text-gray-200">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
          등급 {fmt(grade)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="체력" value={fmt(hp)} />
        <StatCard label="방어력" value={fmt(def)} />
        <StatCard label="공격력" value={fmt(atk)} />
        <StatCard label="속도" value={fmt(speed)} />
      </div>

      <div className="mt-3 rounded-xl bg-gray-900 px-4 py-3 ring-1 ring-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            치명타 확률
          </span>
          <span className="text-xl md:text-2xl font-extrabold text-white">
            {typeof critRate === "number" ? `${critRate}%` : "-"}
          </span>
        </div>
        {typeof critRate === "number" && (
          <div className="mt-2 h-2 w-full rounded-full bg-gray-700">
            <div
              className="h-2 rounded-full bg-emerald-500 transition-all"
              style={{ width: `${Math.max(0, Math.min(100, critRate))}%` }}
              aria-label="치명타 확률"
            />
          </div>
        )}
      </div>

      {_statsLoading && (
        <div className="mt-3 rounded-md bg-white/10 px-3 py-2 text-sm text-gray-300">
          스탯 불러오는 중...
        </div>
      )}
      {_statsError && (
        <div className="mt-3 rounded-md bg-red-900/50 px-3 py-2 text-sm font-medium text-red-300">
          {_statsError}
        </div>
      )}

      <div className="mt-6">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onGrow}
            disabled={_statsLoading || isGrowing}
            className="rounded-xl border border-transparent bg-[#FF8C00] px-6 py-3 text-lg font-bold text-white shadow-md transition hover:bg-[#E07B00] active:bg-[#C06A00] disabled:opacity-60"
          >
            성장시키기
          </button>
          <button
            onClick={onChat}
            disabled={_statsLoading || isGrowing}
            className="rounded-xl border border-gray-600 bg-gray-700 px-6 py-3 text-lg font-semibold text-white shadow-sm transition hover:bg-gray-600 active:bg-gray-500 disabled:opacity-60"
          >
            대화 하기
          </button>
          <button
            onClick={onSend}
            disabled={_statsLoading || isGrowing}
            className="rounded-xl border border-gray-600 bg-gray-700 px-6 py-3 text-lg font-semibold text-white shadow-sm transition hover:bg-gray-600 active:bg-gray-500 disabled:opacity-60"
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
    <div className="rounded-xl bg-gray-900 px-4 py-3 ring-1 ring-gray-700">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </div>
      <div className="mt-1 text-xl md:text-2xl font-extrabold text-white">
        {value}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────── */
/* 내 캐릭터 섹션                                                    */
/* ──────────────────────────────────────────────────────────────── */
function CharacterSection({
  characters = [],
  selectedId,
  onPickClick,
  onOpenCharacter,
  repId,
  onSetRep,
  onClearRep,
}) {
  const hasCharacters = characters.length > 0;

  if (!hasCharacters) {
    return (
      <section className="rounded-md bg-gray-800 min-h-[340px] flex items-center justify-center">
        <div className="text-center px-6 py-12">
          <div className="text-2xl md:text-3xl text-white mb-6">
            내 캐릭터를 뽑아주세요!
          </div>
          <button
            onClick={onPickClick}
            className="px-8 py-3 rounded-lg bg-[#FFC700] border-2 border-[#FFC700] text-gray-900 text-lg font-bold hover:bg-[#E0B200] active:bg-[#C09B00] transition"
          >
            뽑으러가기
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-md bg-gray-800 py-6 px-5 shadow-inner">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-6">
        {characters.map((c) => (
          <CharacterCard
            key={c.id}
            character={c}
            active={selectedId === c.id}
            isRep={repId === c.id}
            onClick={() => onOpenCharacter?.(c)}
            onSetRep={() => onSetRep?.(c.id)}
            onClearRep={() => onClearRep?.()}
          />
        ))}

        <button
          onClick={onPickClick}
          className="aspect-square rounded-2xl bg-gray-700 border-2 border-gray-600 flex items-center justify-center hover:bg-gray-600 active:bg-gray-500 transition"
          aria-label="캐릭터 추가"
          type="button"
        >
          <span className="text-7xl leading-none text-white/70">+</span>
        </button>
      </div>
    </section>
  );
}

function CharacterCard({
  character,
  active,
  onClick,
  isRep,
  onSetRep,
  onClearRep,
}) {
  return (
    <div className="select-none">
      <button
        type="button"
        onClick={onClick}
        className={`aspect-square w-full rounded-2xl overflow-hidden bg-gray-900 border-2 ${
          active
            ? "border-[#FFC700] ring-4 ring-[#FFC700]/50"
            : "border-gray-700 hover:border-gray-500"
        } active:scale-[0.99] transition`}
        aria-label={character?.name ?? ""}
      >
        <div className="w-full h-full p-3 flex items-center justify-center">
          <img
            src={character?.imageUrl}
            alt={character?.name ?? ""}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      </button>

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="text-lg font-medium text-white truncate">
          {character?.name}
        </div>
        {isRep && (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-[#FFC700] text-gray-900">
            ★ 대표
          </span>
        )}
      </div>

      <div className="mt-2">
        {isRep ? (
          <button
            type="button"
            onClick={onClearRep}
            className="w-full rounded-lg border border-gray-600 px-3 py-2 text-sm font-semibold bg-gray-700 text-white hover:bg-gray-600"
          >
            대표 해제
          </button>
        ) : (
          <button
            type="button"
            onClick={onSetRep}
            className="w-full rounded-lg border border-[#FFC700]/50 px-3 py-2 text-sm font-semibold bg-gray-800 text-[#FFC700] hover:bg-gray-700"
          >
            대표로 지정
          </button>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────── */
/* 아이콘/유틸                                                       */
/* ──────────────────────────────────────────────────────────────── */
function IconMail(props) {
  return (
    <svg
      width="45"
      height="45"
      viewBox="0 0 24 24"
      fill="none"
      {...props}
      className={props.className || "w-8 h-8"}
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M3.5 7l8.5 6 8.5-6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
      setPos((p) =>
        p.left === l2 && p.top === top ? p : { top, left: l2, width: pw }
      );
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
        className="rounded-full p-1.5 text-white/90 hover:bg-gray-800 active:bg-gray-700"
      >
        <IconMore className="w-8 h-8" />
      </button>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="false"
            className="fixed z-[100] w-64 rounded-2xl bg-gray-900 shadow-xl ring-1 ring-white/10 overflow-hidden"
            style={{ top: pos.top, left: pos.left }}
          >
            <div className="absolute -top-2 left-6 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-gray-900 drop-shadow" />

            <div className="px-4 py-3 border-b border-gray-700 text-sm text-gray-400">
              더보기
            </div>
            <div className="p-2">
              <button
                className="w-full text-left rounded-xl px-4 py-3 text-[15px] text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#FFC700]"
                onClick={handleEditProfile}
              >
                회원 정보 수정
              </button>
              <button
                className="mt-1 w-full text-left rounded-xl px-4 py-3 text-[15px] text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#FFC700]"
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
