import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function PvpResultModal({
  open,
  data,
  onClose,
  onRematch,   // (선택) 재대결 콜백: (ctx) => void
  onViewLog,   // (선택) 로그 보기 콜백: (battleId) => void
}) {
  const overlayRef = useRef(null);
  const navigate = useNavigate();

  // ESC로 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const resultText = data?.result === "WIN" ? "승리" : "패배";
  const opp = data?.opponentNickname ?? data?.opponentUserId ?? "상대";
  const imageUrl = data?.opponentImageUrl || "/images/character/placeholder.png";

  const battleId = data?.battleId ?? null;
  const opponentUserId = data?.opponentUserId ?? null;
  const opponentCharacterId = data?.opponentCharacterId ?? null;


  const toInt = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
  };

  function getGradeLabel(gradeId) {
    switch (toInt(gradeId)) {
      case 1: return "N";
      case 2: return "R";
      case 3: return "SR";
      case 4: return "SSR";
      case 5: return "UR";
      default: return "-";
    }
  }

  // 재대결 버튼 클릭 시
  const handleRematch = () => {
    const ctx = { opponentUserId, opponentCharacterId, battleId, result: data?.result, gradeId: data?.gradeId, };

    if (onRematch) {
      onRematch(ctx);
      return;
    }

    if (!opponentUserId || !opponentCharacterId) {
      alert("상대 정보가 부족하여 재대결을 시작할 수 없습니다.");
      return;
    }

    // ✅ 기존 기능 유지 + 개선: 매칭 페이지로 state 전달
    navigate("/pvp/match", {
      state: {
        rematch: true,
        opponent: {
          userId: opponentUserId,
          characterId: opponentCharacterId,
          characterName: data?.opponentNickname ?? "상대",
          imageUrl: imageUrl,
          gradeId: data?.gradeId,
          stat: {
            hp: data?.hp ?? 0,
            atk: data?.atk ?? 0,
            def: data?.def ?? 0,
            spd: data?.spd ?? 0,
            crit: data?.crit ?? 0,
          },
        },
      },
    });
  };

  // 로그 보기 버튼 클릭 시
  const handleViewLog = () => {
    if (onViewLog) {
      onViewLog(battleId);
      return;
    }
    if (battleId) window.location.href = `/logs/turns/${battleId}`;
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[1000] bg-black/40 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose?.();
      }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="text-xl font-semibold">전투 결과</h3>
          <button
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm border hover:bg-zinc-50"
          >
            닫기
          </button>
        </div>

        {/* 본문 */}
        <div className="p-6 space-y-6 text-center">
          {/* 상대 캐릭터 이미지 */}
          <div className="flex justify-center">
            <img
              src={imageUrl}
              alt="상대 캐릭터"
              className="w-28 h-28 rounded-full object-cover border-4 border-zinc-200 shadow-md"
              onError={(e) => {
                e.currentTarget.src = "/images/character/placeholder.png";
              }}
            />
          </div>

          {/* 결과/상대 */}
          <div>
            <div className="text-2xl font-bold mb-2">
              {opp} 님에게 {resultText}!
            </div>
            <div className="text-sm text-zinc-500">
              {data?.result === "WIN" ? "축하합니다 🎉" : "다음엔 꼭 이기세요 💪"}
            </div>
          </div>

          {/* 스탯 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
            <Stat label="LV" value={getGradeLabel(data?.gradeId)} />
            <Stat label="HP" value={data?.hp} />
            <Stat label="ATK" value={data?.atk} />
            <Stat label="DEF" value={data?.def} />
            <Stat label="SPD" value={data?.spd} />
            <Stat
              label="CRIT"
              value={data?.crit == null ? "-" : `${data.crit}%`}
            />
          </div>

          {/* 액션 버튼 */}
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleRematch}
              disabled={!opponentUserId || !opponentCharacterId}
              className="rounded-xl border px-4 py-2 text-sm font-semibold bg-white hover:bg-gray-50 disabled:opacity-50"
              title={
                !opponentUserId
                  ? "상대 ID가 없어 재대결을 시작할 수 없습니다"
                  : "재대결"
              }
            >
              재대결
            </button>
            <button
              onClick={handleViewLog}
              disabled={!battleId}
              className="rounded-xl border px-4 py-2 text-sm font-semibold bg-white hover:bg-gray-50 disabled:opacity-50"
              title={
                !battleId
                  ? "전투 ID가 없어 로그 페이지로 이동할 수 없습니다"
                  : "로그 보러가기"
              }
            >
              로그 보러가기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border p-3 bg-white/80 shadow-sm">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="text-lg font-semibold">
        {value == null ? "-" : value}
      </div>
    </div>
  );
}
