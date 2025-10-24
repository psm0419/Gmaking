import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

function GuidePage({ page }) {
  if (!page) return null;

  if (page.type === "text") {
    return (
      <div className="space-y-4">
        <ul className="list-disc pl-6 space-y-2 text-zinc-800 leading-7">
          {(page.body || []).map((line, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: line }} />
          ))}
        </ul>
        {page.note && (
          <div className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-xs text-indigo-900">
            {page.note}
          </div>
        )}
      </div>
    );
  }

  if (page.type === "media") {
    return (
      <figure className="w-full">
        <img
          src={page.imageUrl}
          alt={page.caption ?? "guide image"}
          className="w-full rounded-2xl ring-1 ring-zinc-200"
          loading="lazy"
          draggable={false}
        />
        {page.caption && (
          <figcaption className="mt-3 text-center text-sm text-zinc-600 whitespace-pre-line">
            {page.caption}
          </figcaption>
        )}
      </figure>
    );
  }

  return <div className="text-red-600">지원하지 않는 페이지 타입입니다.</div>;
}

export default function GuideViewer({ guide, onClose, onGo }) {
  const pages = useMemo(() => guide?.pages ?? [], [guide]);
  const [idx, setIdx] = useState(0);
  const prev = () => setIdx((i) => Math.max(0, i - 1));
  const next = () => setIdx((i) => Math.min(pages.length - 1, i + 1));

  const key = guide?.__key;

  const GO_LABELS = {
    pve: "PVE 하러가기",
    pvp: "PVP 하러가기",
    debate: "AI 토론 하러가기",
    chat: "채팅 하러가기",
    characterCreate: "캐릭터 생성 하러가기"
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-zinc-200"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">{guide?.title}</h2>
            <p className="mt-1 text-xs text-zinc-500">
              {pages.length ? `${idx + 1} / ${pages.length}` : "1 / 1"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100"
          >
            닫기
          </button>
        </div>

        <div className="min-h-[280px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.18 }}
            >
              <GuidePage page={pages[idx]} />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-6 grid grid-cols-3 items-center gap-2">
          <div className="justify-self-start">
            <button
              onClick={prev}
              disabled={idx === 0}
              className={`rounded-lg border px-3 py-2 text-sm ${
                idx === 0
                  ? "cursor-not-allowed border-zinc-200 text-zinc-300"
                  : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              ← 이전
            </button>
          </div>

          <div className="justify-self-center">
            {["pve", "pvp", "debate", "chat", "characterCreate"].includes(key) && (
              <button
                onClick={() => onGo?.(key)}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                {GO_LABELS[key]}
              </button>
            )}
          </div>

          <div className="justify-self-end">
            {idx < pages.length - 1 ? (
              <button className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700" onClick={next}>
                다음 →
              </button>
            ) : (
              <button className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700" onClick={onClose}>
                완료
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
