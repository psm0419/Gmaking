import React, { useEffect, useRef } from "react";

export default function PvpResultModal({ open, data, onClose }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const resultText = data?.result === "WIN" ? "승리" : "패배";
  const opp = data?.opponentNickname ?? data?.opponentUserId ?? "상대";

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[1000] bg-black/40 flex items-center justify-center p-4"
      role="dialog" aria-modal="true"
      onClick={(e) => { if (e.target === overlayRef.current) onClose?.(); }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="text-xl font-semibold">전투 결과</h3>
          <button onClick={onClose} className="rounded-full px-3 py-1 text-sm border hover:bg-zinc-50">
            닫기
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="text-lg">
            <b>결과:</b> {resultText} · <b>전투ID:</b> {data?.battleId ?? "-"}
          </div>
          <div><b>상대:</b> {opp}</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
            <Stat label="LV"  value={data?.level} />
            <Stat label="HP"  value={data?.hp} />
            <Stat label="ATK" value={data?.atk} />
            <Stat label="DEF" value={data?.def} />
            <Stat label="SPD" value={data?.spd} />
            <Stat label="CRIT" value={data?.crit == null ? "-" : `${data.crit}%`} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border p-3 bg-white/80">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="text-lg font-semibold">{value == null ? "-" : value}</div>
    </div>
  );
}
