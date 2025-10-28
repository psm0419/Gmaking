import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { useAuth } from "../../context/AuthContext";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { notificationsApi } from "../../api/notifications/notificationApi";
import CertificatePrint from "./CertificatePrint";
import { Egg } from "lucide-react";

// 분리된 웹알림 컴포넌트 + 분리된 PVP 결과 모달
import NotificationBell from "../../components/notifications/NotificationBell";
import PvpResultModal from "../../components/notifications/PvpResultModal";

import GrowthModal from "../../components/growth/GrowthModal";
import GrowthResultModal from "../../components/growth/GrowthResultModal";

const DEFAULT_PROFILE_IMG = "/images/profile/default.png";

/**
 * 값을 안전하게 정수로 변환합니다. 변환 불가능 시 null을 반환합니다.
 * @param {any} v
 * @returns {number|null}
 */
const toInt = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/**
 * 등급 ID에 해당하는 라벨을 반환합니다. (기존 로직 유지)
 * @param {number} gradeId
 * @returns {string}
 */
function getGradeLabel(gradeId) {
  switch (toInt(gradeId)) {
    case 1:
      return "N";
    case 2:
      return "R";
    case 3:
      return "SR";
    case 4:
      return "SSR";
    case 5:
      return "UR";
    default:
      return "-";
  }
}

// 등급별 성장 조건 정의
// 키(1, 2, 3, 4)는 이제 evolution_step을 의미합니다.
const GROWTH_CONDITIONS = {
  // 현재 진화 단계(evolutionStep): { 다음 등급 ID, 요구 클리어 횟수 }
  1: { nextGradeId: 2, requiredClearCount: 10, nextGradeLabel: getGradeLabel(2) },
  2: { nextGradeId: 3, requiredClearCount: 20, nextGradeLabel: getGradeLabel(3) },
  3: { nextGradeId: 4, requiredClearCount: 30, nextGradeLabel: getGradeLabel(4) },
  4: { nextGradeId: 5, requiredClearCount: 50, nextGradeLabel: getGradeLabel(5) },
};

/* ──────────────────────────────────────────────────────────────── */
/* 페이지 스켈레톤
/* ──────────────────────────────────────────────────────────────── */
export default function MyPage() {
  // 스크롤바 제거
  React.useEffect(() => {
    document.body.classList.add("no-scrollbar");
    document.documentElement.classList.add("no-scrollbar");
    return () => {
      document.body.classList.remove("no-scrollbar");
      document.documentElement.classList.remove("no-scrollbar");
    };
  }, []);

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
/* 메인
/* ──────────────────────────────────────────────────────────────── */
function MyMain() {
  const navigate = useNavigate();
  const { user, updateRepresentativeCharacter } = useAuth();

  const [nickname, setNickname] = useState("마스터 님");
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [selected, setSelected] = useState(null);
  const [repId, setRepId] = useState(null);

  const [isGrowthModalOpen, setIsGrowthModalOpen] = useState(false);
  const [isGrowing, setIsGrowing] = useState(false);

  const incubatorCount = Number.isFinite(Number(user?.incubatorCount)) ? Number(user.incubatorCount) : 0;
  const isAdFree = !!user?.isAdFree;

  // 알림
  const [unreadCount, setUnreadCount] = useState(0);

  // PVP 모달
  const [pvpModalOpen, setPvpModalOpen] = useState(false);
  const [pvpModalData, setPvpModalData] = useState(null);

  const [growthResult, setGrowthResult] = useState(null);

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

  // ---[ 추가: 공통 인증 헤더 ]---
  const authHeaders = React.useMemo(() => {
    if (!token) return {};
    return {
      Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }, [token]);

  // ---[ 추가: summary 캐릭터 + certificate 병합 유틸 ]---
  const mergeCharWithCert = useCallback((base, cert) => {
    if (!cert) return base;
    return {
      ...base,
      // 텍스트/설명
      personalityDescription:
        cert.personality ??
        base.personalityDescription ??
        base.personality ??
        null,
      backgroundInfo:
        cert.backgroundInfo ??
        base.backgroundInfo ??
        null,

      // 스탯/진화/클리어
      hp: cert.hp ?? base.hp ?? null,
      attack: cert.attack ?? base.attack ?? null,
      defense: cert.defense ?? base.defense ?? null,
      speed: cert.speed ?? base.speed ?? null,
      criticalRate:
        (typeof cert.criticalRate === "number" ? cert.criticalRate : base.criticalRate) ?? null,
      evolutionStep: cert.evolutionStep ?? base.evolutionStep ?? null,
      stageClearCount: cert.totalStageClears ?? base.stageClearCount ?? 0,
    };
  }, []);

  // ---[ 추가: 인증서 API 호출 ]---
  const fetchCertificate = useCallback(
    async (characterId) => {
      const { data } = await axios.get(`/api/characters/${characterId}/certificate`, {
        headers: authHeaders,
      });
      return data;
    },
    [authHeaders]
  );

  /**
   * 마이페이지 요약 데이터를 서버에서 가져옵니다.
   * @param {boolean} silent - 로딩 상태를 변경하지 않고 데이터를 가져올지 여부
   */
  const fetchSummaryData = useCallback(
    async (silent = false) => {
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        if (!silent) setLoading(true);

        // 1. 요약 데이터 (프로필, 캐릭터 목록) 가져오기
        const { data } = await axios.get("/api/my-page/summary", {
          headers: authHeaders,
          params: { limit: 50 },
        });

        const p = data?.profile ?? null;
        setNickname(p?.nickname ?? "마스터 님");
        setProfileImageUrl(p?.imageUrl ?? null);

        const cards = (data?.characters ?? []).map((c) => {
          const stat = c.characterStatVO || c.characterStat || null;
          const grade = c.grade ?? c.rarity ?? null;
          // evolutionStep을 API 응답에서 가져온다고 가정하고 추가 (없으면 1로 기본 설정)
          const evolutionStep = c.evolutionStep ?? 1;
          const personalityDescription =
            c.personalityDescription ??
            c.personality ??
            c.personaDescription ??
            c.persona?.description ??
            null;

        const backgroundInfo =
            c.backgroundInfo ??
            c.background ??
            c.backgroundDescription ??
            c.story ??
            null;

          return {
            id: c.characterId ?? c.id,
            name: c.name ?? c.characterName ?? "",
            grade,
            gradeLabel: getGradeLabel(grade),
            evolutionStep: toInt(evolutionStep), // 진화 단계 필드 추가
            imageUrl: c.imageUrl ?? c.image ?? null,
            hp: stat?.hp ?? null,
            attack: stat?.attack ?? null,
            defense: stat?.defense ?? null,
            speed: stat?.speed ?? null,
            criticalRate: stat?.criticalRate ?? null,
            characterStatVO: stat,
            stageClearCount: c.stageClearCount ?? 0,
            personalityDescription,
            backgroundInfo,
          };
        });
        setCharacters(cards);
        setError(null);

        // 2. 대표 캐릭터 조회
        try {
          const rep = await axios.get("/api/my-page/representative-character", {
            headers: authHeaders,
          });
          setRepId(rep?.data?.characterId ?? null);
        } catch (e) {
          console.warn("대표 캐릭터 조회 실패", e);
        }

        // 3. 초기 알림 개수 조회
        try {
          const n = await notificationsApi.count();
          setUnreadCount(Number(n ?? 0));
        } catch (e) {
          console.warn("초기 알림 개수 조회 실패", e);
        }

        // 만약 선택된 캐릭터가 있었다면, 갱신된 정보로 업데이트
        setSelected((prev) => {
          if (!prev) return null;
          const updatedChar = cards.find((c) => c.id === prev.id);
          return updatedChar || null;
        });
      } catch (e) {
        console.error(e);
        setError("마이페이지 데이터를 불러오지 못했습니다.");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [token, navigate, authHeaders]
  );

  // 서버에서 요약 데이터 가져오기 (컴포넌트 마운트 시)
  useEffect(() => {
    fetchSummaryData();
  }, [fetchSummaryData]);

  // 상세 열 때 인증서 API 병합
  const onOpenCharacter = async (c) => {
    // 먼저 요약 데이터로 즉시 표시
    setSelected(c);
    // 인증서 상세 불러와 병합
    try {
      const cert = await fetchCertificate(c.id);
      setSelected((prev) => (prev && prev.id === c.id ? mergeCharWithCert(prev, cert) : prev));
    } catch (e) {
      console.warn("인증서 상세 병합 실패", e);
    }
  };

  const onChat = () => selected?.id && navigate(`/chat-entry/${selected.id}`);
  const onGrow = () => {
    if (selected?.id) {
      setIsGrowthModalOpen(true);
    }
  };
  const onSend = () => {};
  const onPickClick = () => navigate("/create-character");

  const setRepresentative = async (characterId) => {
    if (!characterId) return;

    try {
      await axios.patch("/api/my-page/representative-character", { characterId }, { headers: authHeaders });

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
      await axios.delete("/api/my-page/representative-character", { headers: authHeaders });
      setRepId(null);
      // AuthContext와 localStorage 갱신 (이미지 URL, ID를 null로)
      updateRepresentativeCharacter(null, null);
    } catch (e) {
      alert(e?.response?.data?.message || "대표 캐릭터 해제에 실패했습니다.");
    }
  };
  
  const handleConfirmGrowth = async () => {
    if (!selected?.id || isGrowing) return;

    const currentEvolutionStep = selected.evolutionStep;
    const condition = GROWTH_CONDITIONS[currentEvolutionStep];

    // 1. 성장 가능 여부 확인 (최대 단계 체크)
    if (!condition) {
      alert(`[${getGradeLabel(selected.grade)}] 캐릭터는 더 이상 성장할 수 없는 최대 성장 단계입니다.`);
      setIsGrowthModalOpen(false);
      return;
    }

    const currentClearCount = selected.stageClearCount ?? 0;
    const remaining = Math.max(0, condition.requiredClearCount - currentClearCount);

    // 2. 스테이지 클리어 횟수 조건 확인
    if (remaining > 0) {
      alert(
        `캐릭터 성장에 실패했습니다. (${selected.name})\n` +
        `다음 단계로 성장하려면, 남은 ${remaining}회 클리어해야 합니다.\n` +
        `(현재: ${currentClearCount}회 / 필요: ${condition.requiredClearCount}회)`
      );
      setIsGrowthModalOpen(false);
      return;
    }

    let targetModificationKey = "";
    switch (currentEvolutionStep) {
      case 1:
        targetModificationKey = "EVO_KEY_EGG";
        break;
      case 2:
        targetModificationKey = "EVO_KEY_BABY";
        break;
      case 3:
        targetModificationKey = "EVO_KEY_TEEN";
        break;
      case 4:
        targetModificationKey = "EVO_KEY_FINAL";
        break;
      default:
        alert("알 수 없는 진화 단계입니다. 성장을 진행할 수 없습니다.");
        setIsGrowthModalOpen(false);
        return;
    }

    setIsGrowing(true); // 로딩 시작
    try {
      const requestBody = {
        character_id: selected.id,
        user_id: userId,
        targetModification: targetModificationKey,
        evolution_step: currentEvolutionStep,
      };

      const response = await axios.post("/growth/character", requestBody, { headers: authHeaders });
      const growthData = response.data;

      // 성공 후 상태 정리 및 데이터 갱신
      setIsGrowthModalOpen(false);
      setGrowthResult(growthData);
    } catch (e) {
      alert(e?.response?.data?.message || "캐릭터 성장에 실패했습니다.");
    } finally {
      setIsGrowing(false); // 로딩 종료
    }
  };

  /* =========================
   *  인증서 프린트 상태/핸들러
   * ========================= */
  const [certificateData, setCertificateData] = useState(null); // 인쇄용 데이터
  const [printOpen, setPrintOpen] = useState(false);

  // 인쇄 직전 인증서 API 반영
  const handlePrintCertificate = useCallback(
    async (c) => {
      if (!c?.id) return;

      // 가능한 한 최신/정확한 값 확보
      let certApi = null;
      try {
        certApi = await fetchCertificate(c.id);
      } catch (e) {
        console.warn("인증서 API 호출 실패 → 화면 값으로 인쇄 진행", e);
      }

      const pick = (a, b, fallback = null) =>
        a !== undefined && a !== null && a !== "" ? a : (b ?? fallback);

      const final = {
        // 유저
        userNickname: nickname,

        // 캐릭터 기본
        characterImageUrl: c?.imageUrl || null,
        characterName: pick(c?.name ?? c?.characterName, certApi?.characterName, "-"),
        gradeId: pick(c?.grade, certApi?.gradeId, null),
        gradeLabel: getGradeLabel(pick(c?.grade, certApi?.gradeId, null)),
        backgroundInfo: pick(
          c?.backgroundInfo ?? c?.background ?? c?.backgroundDescription ?? c?.story,
          certApi?.backgroundInfo,
          ""
        ),
        evolutionStep: pick(c?.evolutionStep, certApi?.evolutionStep, null),
        totalStageClears: pick(c?.stageClearCount, certApi?.totalStageClears, 0),

        // 스탯
        hp: pick(c?.hp, certApi?.hp, null),
        attack: pick(c?.attack, certApi?.attack, null),
        defense: pick(c?.defense, certApi?.defense, null),
        speed: pick(c?.speed, certApi?.speed, null),
        criticalRate:
          typeof c?.criticalRate === "number"
            ? c.criticalRate
            : (typeof certApi?.criticalRate === "number" ? certApi.criticalRate : null),

        // 성격
        personality: pick(
          c?.personalityDescription ?? c?.personaDescription ?? c?.personality ?? c?.persona?.description,
          certApi?.personality,
          ""
        ),

        // 전투 카운트(있으면 사용)
        pveCount: pick(c?.stageClearCount, certApi?.pveCount, 0),
        pvpCount: pick(undefined, certApi?.pvpCount, 0),

        issuedAt: new Date().toISOString(),
      };

      try { window.__notifyPause?.(); } catch {}
      setCertificateData(final);
      setPrintOpen(true);
    },
    [nickname, fetchCertificate]
  );

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
  const selectedCharacterCondition = GROWTH_CONDITIONS[selected?.evolutionStep];

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-8">
      <div className="grid gap-6 md:grid-cols-[minmax(320px,540px),1fr] items-stretch">
        <section
          className="bg-gray-800 border-2 border-[#FFC700] rounded-[16px] p-6 w-full shadow-lg
                    h-full min-h-[300px] sm:min-h-[360px] md:min-h-[360px]"
        >
          <div className="h-full flex">
            <div className="flex w-full gap-6 items-center">
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

                <div className="mt-6 flex items-center gap-5 text:white/90 text-white/90">
                  <NotificationBell
                    initialCount={unreadCount}
                    token={token}
                    onUpdateCount={(n) => setUnreadCount(n)}
                    onOpenPvpModal={(data) => {
                      setPvpModalData(data);
                      setPvpModalOpen(true);
                    }}
                  />
                  <IconMail className="w-10 h-10 text-white/90" />
                  <MoreMenuInline />
                </div>
              </div>

              {/* 오른쪽: 텍스트/배지 영역 (세로 가운데 정렬) */}
              <div className="flex-1 h-full flex flex-col justify-center text-white">
                <div className="text-2xl md:text-[28px] font-bold text-white">{nickname}</div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between rounded-lg bg-gray-700/70 p-4 shadow-inner border border-gray-700">
                    <span className="text-base font-semibold text-white/90">보유 부화권</span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-extrabold text-[#FFC700] drop-shadow-md">{incubatorCount}</span>
                      <Egg
                        role="img"
                        aria-label="egg"
                        className="w-5 h-5 text-[#FFC700]"
                        strokeWidth={2.5}
                        fill="#FFC700"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-gray-700/70 p-4 shadow-inner border border-gray-700">
                    <span className="text-base font-semibold text-white/90">광고 시청 면제</span>
                    {isAdFree ? (
                      <span className="rounded-full bg-emerald-600 px-3 py-1 text-sm font-bold text-white shadow-sm">
                        AD-FREE
                      </span>
                    ) : (
                      <span className="rounded-full bg-red-600 px-3 py-1 text-sm font-bold text-white shadow-sm">광고 시청</span>
                    )}
                  </div>

                  <button
                    onClick={() => navigate("/quest")}
                    className="w-full rounded-lg bg-[#FFC700] hover:bg-[#E0B200] active:bg-[#C09B00] px-4 py-3 text-center text-sm font-bold text-gray-900 shadow-md transition"
                  >
                    오늘의 퀘스트 보러가기
                  </button>
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
            onPrintCertificate={handlePrintCertificate} // 인쇄 핸들러
          />
        )}
      </div>

      <h2 className="mt-8 mb-4 text-xl md:text-2xl font-bold text-white">내 캐릭터</h2>

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
      <PvpResultModal open={pvpModalOpen} data={pvpModalData} onClose={() => setPvpModalOpen(false)} />

      {/* 성장 모달 추가 */}
      <GrowthModal
        open={isGrowthModalOpen}
        characterName={selected?.name}
        incubatorCount={incubatorCount}
        isGrowing={isGrowing}
        onConfirm={handleConfirmGrowth}
        onClose={() => {
          // 성장 중이 아닐 때만 닫기 허용
          if (!isGrowing) {
            setIsGrowthModalOpen(false);
          }
        }}
        currentGradeLabel={selected?.gradeLabel || "-"}
        nextGradeLabel={selectedCharacterCondition ? selectedCharacterCondition.nextGradeLabel : "최대 단계"}
        requiredClearCount={selectedCharacterCondition ? selectedCharacterCondition.requiredClearCount : 0}
        currentClearCount={selected?.stageClearCount ?? 0}
      />

      {/* 성장 결과 모달 (이미지 비교) */}
      {growthResult && selected && (
        <GrowthResultModal
        // API 호출 직전의 '현재' 캐릭터 데이터 (성장 전 이미지 URL이 포함됨)
        currentCharacter={selected}
        // API 응답으로 받은 성장 후 이미지(Base64) 및 데이터
        growthResult={growthResult}
        onClose={() => {
          setGrowthResult(null); // 모달 닫기

          // 🚨 [이동된 코드] 모달이 닫힐 때 메인 데이터 갱신
          fetchSummaryData();
        }}
      />
    )}
      {/* 프린트 전용 인증서 뷰 (포털) */}  
      <CertificatePrint
        open={printOpen}
        data={certificateData}
        onFinish={({ reason }) => {
          // 프린트 다이얼로그는 성공/취소를 구분해주지 않으므로 후속 안내 없음
          setTimeout(() => {
            try { window.__notifyResume?.(); } catch {}
          }, 800);
        }}
        onClose={() => {
          setPrintOpen(false);
          setCertificateData(null);
        }}
      />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────── */
/* 캐릭터 상세 패널
/* ──────────────────────────────────────────────────────────────── */
function CharacterDetail({ character, onGrow, onChat, onSend, isGrowing, onPrintCertificate }) {
  const [tab, setTab] = React.useState("stat");
  const name = character?.name ?? character?.characterName;
  const grade = character?.grade;
  const evolutionStep = character?.evolutionStep;
  const hp = character?.hp;
  const def = character?.defense;
  const atk = character?.attack;
  const speed = character?.speed;
  const critRate = character?.criticalRate;
  const _statsLoading = false;
  const _statsError = null;
  const fmt = (v) => (v == null ? "-" : `${v}`);
  const clearCount = character?.stageClearCount ?? 0;
  const condition = GROWTH_CONDITIONS[evolutionStep];
  const nextGradeLabel = condition ? condition.nextGradeLabel : "최대 단계";
  const requiredClearCount = condition ? condition.requiredClearCount : 0;
  const currentClearCount = character?.stageClearCount ?? 0; 
  const remaining = Math.max(0, requiredClearCount - currentClearCount);

  return (
    <section className="rounded-2xl border border-[#FFC700]/50 bg-gray-800 p-6 shadow-xl">
      <div className="mb-5 flex items-center gap-3 flex-wrap">
        <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">{fmt(name)}</h3>

        {/* 탭 버튼 (이름 바로 옆) */}
        <div className="inline-flex rounded-lg bg-gray-900 p-1 ring-1 ring-gray-700">
          <button
            type="button"
            onClick={() => setTab("stat")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition
                    ${tab === "stat" ? "bg-[#FFC700] text-gray-900" : "text-gray-300 hover:text-white"}`}
          >
            스탯
          </button>
          <button
            type="button"
            onClick={() => setTab("growth")}
            className={`ml-1 px-3 py-1.5 rounded-md text-xs font-bold transition
                    ${tab === "growth" ? "bg-[#FFC700] text-gray-900" : "text-gray-300 hover:text-white"}`}
          >
            성장단계
          </button>
        </div>

        {/* 등급 뱃지 */}
        <span className="inline-flex items-center gap-1 rounded-full border border-gray-600 bg-gray-900 px-3 py-1 text-sm font-semibold text-gray-200">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
          등급 {getGradeLabel(grade)}
        </span>
      </div>

      {/* 탭 내용 */}
      {tab === "stat" ? (
        <>
          {/* 스탯 그리드 */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="체력" value={fmt(hp)} />
            <StatCard label="방어력" value={fmt(def)} />
            <StatCard label="공격력" value={fmt(atk)} />
            <StatCard label="속도" value={fmt(speed)} />
          </div>

          {/* 치명타 확률 */}
          <div className="mt-3 rounded-xl bg-gray-900 px-4 py-3 ring-1 ring-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">치명타 확률</span>
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
        </>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {/* 스테이지 클리어 횟수 */}
            <div className="rounded-xl bg-gray-900 px-4 ring-1 ring-gray-700
                                  h-[72px] flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">스테이지 클리어 횟수</span>
              <span className="text-xl md:text-2xl font-extrabold text-white leading-none">{clearCount}회</span>
            </div>

            {/* 다음 성장 조건 */}
            <div className="rounded-xl bg-gray-900 px-4 ring-1 ring-gray-700
                                  h-[72px] flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">다음 성장 조건</span>
              <span className="text-lg font-bold text-[#FFC700] leading-none text-right whitespace-pre-line">
                {remaining > 0
                  ? `스테이지 ${remaining}회`
                  : `조건 충족!`}
              </span>
            </div>
          </div>
        </>
      )}

      {_statsLoading && (
        <div className="mt-3 rounded-md bg白/10 px-3 py-2 text-sm text-gray-300">스탯 불러오는 중...</div>
      )}
      {_statsError && (
        <div className="mt-3 rounded-md bg-red-900/50 px-3 py-2 text-sm font-medium text-red-300">{_statsError}</div>
      )}

      <div className="mt-6">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onGrow}
            disabled={remaining > 0 || isGrowing}
            className={`rounded-xl border border-transparent px-6 py-3 text-lg font-bold text-white shadow-md transition ${
              remaining === 0
              ? 'bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600'
              : 'bg-[#FF8C00] hover:bg-[#E07B00] active:bg-[#C06A00] opacity-60'
            }`}
          >
            {remaining === 0 ? '성장 가능!' : '성장 준비'}
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
          <button
            onClick={() => onPrintCertificate?.(character)}
            className="rounded-xl border border-gray-600 bg-gray-700 px-6 py-3 text-sm leading-tight
                                   font-semibold text-white shadow-sm transition hover:bg-gray-600 active:bg-gray-500 disabled:opacity-60"
          >
            <span className="block">캐릭터</span>
            <span className="block">인증서</span>
          </button>
        </div>
      </div>
    </section>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl bg-gray-900 px-4 py-3 ring-1 ring-gray-700">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</div>
      <div className="mt-1 text-xl md:text-2xl font-extrabold text-white">{value}</div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────── */
/* 내 캐릭터 섹션
/* ──────────────────────────────────────────────────────────────── */
function CharacterSection({ characters = [], selectedId, onPickClick, onOpenCharacter, repId, onSetRep, onClearRep }) {
  const hasCharacters = characters.length > 0;

  if (!hasCharacters) {
    return (
      <section className="rounded-md bg-gray-800 min-h-[340px] flex items-center justify-center">
        <div className="text-center px-6 py-12">
          <div className="text-2xl md:text-3xl text-white mb-6">내 캐릭터를 뽑아주세요!</div>
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

function CharacterCard({ character, active, onClick, isRep, onSetRep, onClearRep }) {
  return (
    <div className="select-none">
      <button
        type="button"
        onClick={onClick}
        className={`aspect-square w-full rounded-2xl overflow-hidden bg-gray-900 border-2 ${
          active ? "border-[#FFC700] ring-4 ring-[#FFC700]/50" : "border-gray-700 hover:border-gray-500"
        } active:scale-[0.99] transition`}
        aria-label={character?.name ?? ""}
      >
        <div className="w-full h-full p-3 flex items-center justify-center">
          <img src={character?.imageUrl} alt={character?.name ?? ""} className="max-h-full max-w-full object-contain" />
        </div>
      </button>

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="text-lg font-medium text-white truncate">
          {character?.name}
          <span className="ml-1 text-xs text-gray-400 align-baseline">
            (등급 {character?.gradeLabel ?? getGradeLabel(character?.grade)})
          </span>
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
/* 아이콘/유틸
/* ──────────────────────────────────────────────────────────────── */
function IconMail(props) {
  // className을 props로 받도록 수정
  const finalClassName = props.className || "w-8 h-8 text-white";
  return (
    <svg width="45" height="45" viewBox="0 0 24 24" fill="none" {...props} className={finalClassName}>
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
  const [pos, setPos] = useState({ top: 0, left: 0 });

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


  const updatePosition = useCallback(() => {
    const btn = btnRef.current;
    const panel = panelRef.current;
    if (!btn || !panel) return;

    const r = btn.getBoundingClientRect();
    const margin = 0;   // 버튼과 패널 사이 간격
    const offsetY = 0; // 아래로 내려주는 값
    const panelW = panel.offsetWidth;

    // 버튼의 "오른쪽"에 고정해서 붙이기
    let left = r.right + margin;

    // 화면 오른쪽 밖으로 너무 튀어나가면 살짝만 안쪽으로 (하지만 '오른쪽 기준'은 유지)
    const maxLeft = window.innerWidth - panelW - margin;
    left = Math.min(left, maxLeft);

    const top = r.bottom + offsetY;

    setPos({ top, left });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, updatePosition]);

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
    window.addEventListener("scroll", onResizeScroll, { capture: true, passive: true });
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown, { passive: true });
    document.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("resize", onResizeScroll);
      window.removeEventListener("scroll", onResizeScroll, { capture: true, passive: true });
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, updatePosition]);

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
            {/* ▲ 위쪽 화살표 (패널 상단, 왼쪽에 배치해서 버튼을 가리키는 느낌) */}
            <div
              className="absolute -top-2 left-4 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-gray-900 drop-shadow"
            />
            <div className="px-4 py-3 border-b border-gray-700 text-sm text-gray-400">더보기</div>
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
