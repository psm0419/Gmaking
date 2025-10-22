import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { motion } from "framer-motion";

/** 바깥 클릭 시 닫기 */
function useOutsideClick(ref, onClickOutside) {
  useEffect(() => {
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) onClickOutside?.();
    }
    document.addEventListener("mousedown", handle);
    document.addEventListener("touchstart", handle);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("touchstart", handle);
    };
  }, [ref, onClickOutside]);
}

export default forwardRef(function CharacterAssistant(
  {
    images = ["/images/character/idle.png"], // idle: 한 장이면 숨쉬기, 여러 장이면 루프
    name = "도우미",
    options = ["안녕!", "무엇을 할 수 있어?", "도움말"],
    onChoose,
    onAsk,
    bubblePlacement = "left", // "left" | "right"
    frameMs = 400, // idle 1-2-1 속도

    blinkFrameMs = 120,      // 눈깜빡임 2-3-4-1 속도
    blinkMinMs = 3000,       // 최소 깜빡임 간격
    blinkMaxMs = 6000,       // 최대 깜빡임 간격

    // open 제어(선택): prop 없으면 내부 상태로 관리
    open: openProp,
    onOpenChange,

    // 인트로 프레임(한 번 재생)
    introImages = [],
    introFrameMs = 500,
    playIntroOnEveryOpen = true, // false면 첫 오픈 때만
    introOnMount = false, // i로 나타나는 순간 인트로 재생
  },
  ref
) {
  const isSequence = images.length > 1;
  const isIntroSeq = Array.isArray(introImages) && introImages.length > 0;

  // 말풍선 open 상태 (컨트롤드/언컨트롤드)
  const [openUncontrolled, setOpenUncontrolled] = useState(false);
  const open = openProp ?? openUncontrolled;
  const setOpen = (v) => {
    const next = typeof v === "function" ? v(open) : v;
    onOpenChange?.(next);
    if (openProp === undefined) setOpenUncontrolled(next);
  };

  // ===== Idle/Blink 상태머신 =====
  const [frame, setFrame] = useState(0);
  const loopRef = useRef(null);       // idle interval
  const blinkRef = useRef(null);      // blink interval
  const nextBlinkRef = useRef(null);  // blink 예약 timeout

  function clearAllTimers() {
    clearInterval(loopRef.current);
    clearInterval(blinkRef.current);
    clearTimeout(nextBlinkRef.current);
  }

  function startIdleLoop() {
    // idle 시퀀스: 1,2,1 (index 0,1,0)
    const seq = [0, 1, 0];
    let i = 0;
    loopRef.current = setInterval(() => {
      setFrame(seq[i]);
      i = (i + 1) % seq.length;
    }, frameMs);
  }

  function scheduleNextBlink() {
    const gap =
      Math.floor(Math.random() * (blinkMaxMs - blinkMinMs)) + blinkMinMs;
    nextBlinkRef.current = setTimeout(() => {
      // blink 시퀀스: 2,3,4,1 (index 1,2,3,0)
      const seq = [1, 2, 3, 0];
      let i = 0;
      clearInterval(loopRef.current); // idle 잠시 중지
      blinkRef.current = setInterval(() => {
        setFrame(seq[i]);
        i++;
        if (i >= seq.length) {
          clearInterval(blinkRef.current);
          startIdleLoop();      // 끝나면 idle 재개
          scheduleNextBlink();  // 다음 깜빡임 예약
        }
      }, blinkFrameMs);
    }, gap);
  }

  // 말풍선 & 앵커 ref
  const bubbleRef = useRef(null);
  const anchorRef = useRef(null);
  useOutsideClick(bubbleRef, () => setOpen(false));

  // 버블 방향 클래스
  const placementClass = useMemo(
    () =>
      bubblePlacement === "right"
        ? "left-full ml-3 origin-left"
        : "right-full mr-3 origin-right",
    [bubblePlacement]
  );

  // 인트로 상태
  const [didIntroOnce, setDidIntroOnce] = useState(false);
  const [phase, setPhase] = useState(introOnMount ? "intro" : "idle"); // "intro" | "idle"
  const [introFrame, setIntroFrame] = useState(0);

  // i로 나타나는 순간 인트로 재생
  useEffect(() => {
    if (introOnMount && isIntroSeq) {
      setPhase("intro");
      setIntroFrame(0);
    }
  }, [introOnMount, isIntroSeq]);

  // 캐릭터(말풍선 토글)로 열 때 인트로 재생
  useEffect(() => {
    if (!open) return;
    if (isIntroSeq && (playIntroOnEveryOpen || !didIntroOnce)) {
      setPhase("intro");
      setDidIntroOnce(true);
      clearAllTimers(); // 인트로 시작 전에 타이머 정리
    } else {
      setPhase("idle");
    }
  }, [open, isIntroSeq, playIntroOnEveryOpen, didIntroOnce]);

  // 인트로 프레임 루프 (끝나면 idle로 전환)
  useEffect(() => {
    if (phase !== "intro") return;
    setIntroFrame(0);
    const id = setInterval(() => {
      setIntroFrame((f) => {
        const next = f + 1;
        if (next >= introImages.length) {
          clearInterval(id);
          setPhase("idle");
          return f;
        }
        return next;
      });
    }, introFrameMs);
    return () => clearInterval(id);
  }, [phase, introImages.length, introFrameMs]);

  // idle/bLink 타이머 구동 (phase가 idle일 때만)
  useEffect(() => {
    if (!isSequence || phase !== "idle") return;
    clearAllTimers();
    startIdleLoop();
    scheduleNextBlink();
    return clearAllTimers;
  }, [isSequence, phase, frameMs, blinkFrameMs, blinkMinMs, blinkMaxMs]);

  // 현재 보여줄 이미지 소스
  const currentSrc =
    phase === "intro"
      ? isIntroSeq
        ? introImages[introFrame]
        : images[0] ?? ""
      : isSequence
      ? images[frame]
      : images[0];

  // 프레임 교체 깜빡임 방지: 수동 교차-페이드 레이어
  const [displaySrc, setDisplaySrc] = useState(currentSrc);
  const [prevSrc, setPrevSrc] = useState(null);
  useEffect(() => {
    if (currentSrc === displaySrc) return;
    setPrevSrc(displaySrc);
    setDisplaySrc(currentSrc);
    const t = setTimeout(() => setPrevSrc(null), 260); // 페이드 시간과 맞춤
    return () => clearTimeout(t);
  }, [currentSrc, displaySrc]);

  // 프리로드(첫 교체 때 블랭크 방지)
  useEffect(() => {
    [...introImages, ...images].forEach((src) => {
      const im = new Image();
      im.src = src;
    });
  }, [introImages, images]);

  function handleChoose(opt) {
    onChoose?.(opt);
    setOpen(false);
  }
  function handleAsk() {
    const text = (input || "").trim();
    if (!text) return;
    onAsk?.(text);
    setInput("");
    setOpen(false);
  }

  const [input, setInput] = useState("");

  useImperativeHandle(ref, () => ({
    open: () => setOpen(true),
    close: () => setOpen(false),
    toggle: () => setOpen((v) => !v),
    isOpen: () => !!open,
  }));

  // 애니메이션 프리셋 (바닥 고정, 승천 금지: y=0)
  const isIntroFirst = phase === "intro" && introFrame === 0;

  const currentInitial = isIntroFirst
    ? { opacity: 0, scale: 0.7, y: 0 }
    : { opacity: 0, scale: 1, y: 0 };

  const currentAnimate = isIntroFirst
    ? { opacity: 1, scale: [0.7, 1.1, 1], y: 0 }
    : { opacity: 1, scale: [1, 1.02, 1], y: 0 };

  const currentDuration = isIntroFirst ? 0.6 : 0.24;

  return (
    <div className="fixed bottom-6 right-6 z-[60] select-none">
      {/* Anchor / Character */}
      <button
        ref={anchorRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="group relative block focus:outline-none"
      >
        {/* 고정 컨테이너(겹치기) */}
        <div className="relative h-40 w-40 overflow-hidden">
          {/* 이전 프레임: 아래 레이어 (서서히 사라짐) */}
          {prevSrc && (
            <motion.img
              src={prevSrc}
              alt=""
              className="absolute inset-0 h-full w-full object-contain drop-shadow-xl pointer-events-none"
              style={{
                transformOrigin: "50% 100%",
                willChange: "opacity, transform",
                transform: "translateZ(0)",
              }}
              initial={{ opacity: 1, scale: 1, y: 0 }}
              animate={{ opacity: 0, scale: 1, y: 0 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
            />
          )}

          {/* 현재 프레임: 위 레이어 */}
          <motion.img
            src={displaySrc}
            alt={`${name} 캐릭터`}
            className="absolute inset-0 h-full w-full object-contain drop-shadow-xl pointer-events-none"
            style={{
              transformOrigin: "50% 100%",
              willChange: "opacity, transform",
              transform: "translateZ(0)",
            }}
            initial={currentInitial}
            animate={phase === "idle" ? { opacity: 1, scale: 1, y: 0 } : currentAnimate}
            transition={phase === "idle" ? { duration: 0 } : { duration: currentDuration, ease: "easeOut" }}
            whileHover={phase !== "intro" ? { rotate: [0, -2, 2, 0] } : undefined}
          />
        </div>

        <span className="pointer-events-none absolute -top-2 -right-2 rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-semibold text-white shadow-lg">
          online
        </span>
        <span className="sr-only">{name}</span>
      </button>

      {/* Speech Bubble */}
      {open && (
        <motion.div
          ref={bubbleRef}
          role="dialog"
          aria-label={`${name} 대화 상자`}
          initial={{ opacity: 0, scale: 0.95, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 4 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className={`absolute bottom-2 ${placementClass}`}
        >
          <div className="relative max-w-[22rem] rounded-2xl border border-zinc-200 bg-white/95 p-4 shadow-2xl backdrop-blur-md">
            {/* 꼬리 */}
            <div
              className={`absolute bottom-2 ${
                bubblePlacement === "right" ? "-left-2" : "-right-2"
              } h-4 w-4 rotate-45 border border-zinc-200 bg-white/95`}
              aria-hidden
            />
            <div className="mb-2 text-sm font-semibold text-zinc-700">
              {name}
            </div>
            <div className="mb-3 text-sm text-zinc-600">
              무엇을 할까요? 아래에서 선택하거나, 직접 질문해 주세요.
            </div>

            {/* 퀵 선택지 */}
            <div className="mb-3 flex flex-wrap gap-2">
              {options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleChoose(opt)}
                  className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                >
                  {opt}
                </button>
              ))}
            </div>

            {/* 질문 입력 */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                placeholder="질문을 입력하세요..."
                className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-0 placeholder:text-zinc-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-300"
              />
              <button
                type="button"
                onClick={handleAsk}
                className="rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-violet-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-violet-400"
              >
                전송
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
});
