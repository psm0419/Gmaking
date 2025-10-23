import React, { useEffect, useRef } from "react";
import { GUIDE_CONFIG } from "../../constants/guideConfig";
import { useNavigate } from "react-router-dom";

export default function FeatureGuideModal({ featureKey, open, onClose }) {
  const nav = useNavigate();
  const data = GUIDE_CONFIG[featureKey];
  const dialogRef = useRef(null);

  // ESC로 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !data) return null;

  function goCTA() {
    if (data.ctaTo) nav(data.ctaTo);
    onClose?.();
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50"
      onClick={(e) => {
        // 바깥 클릭 닫기
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        ref={dialogRef}
        className="mx-4 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-zinc-200"
        role="dialog"
        aria-modal="true"
      >
        {/* 헤더 */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">{data.title}</h2>
            {data.subtitle && (
              <p className="mt-1 text-sm text-zinc-600">{data.subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-zinc-500 hover:bg-zinc-100"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* 이미지 */}
        {data.imageUrl && (
          <img
            src={data.imageUrl}
            alt=""
            className="mb-4 w-full rounded-xl object-cover"
          />
        )}

        {/* 본문 */}
        {Array.isArray(data.body) && data.body.length > 0 && (
          <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-zinc-700">
            {data.body.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        )}

        {/* 스텝 */}
        {Array.isArray(data.steps) && data.steps.length > 0 && (
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            {data.steps.map((s, i) => (
              <div
                key={i}
                className="rounded-xl border border-zinc-200 bg-zinc-50 p-3"
              >
                <div className="text-sm font-semibold text-zinc-800">
                  {i + 1}. {s.label}
                </div>
                <div className="text-xs text-zinc-600">{s.desc}</div>
              </div>
            ))}
          </div>
        )}

        {/* 모델 정보 */}
        {Array.isArray(data.modelInfo) && data.modelInfo.length > 0 && (
          <div className="mb-5 rounded-xl border border-indigo-200 bg-indigo-50 p-3">
            <div className="mb-1 text-sm font-semibold text-indigo-800">
              사용 AI / 모델
            </div>
            <ul className="list-disc space-y-1 pl-5 text-xs text-indigo-900">
              {data.modelInfo.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 버튼 영역 */}
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            돌아가기
          </button>
          {data.ctaText && (
            <button
              onClick={goCTA}
              className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700"
            >
              {data.ctaText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}