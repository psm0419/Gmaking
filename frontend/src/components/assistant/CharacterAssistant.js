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
    options = ["인사하기", "겜만중이 뭐야?", "AI가 뭐야?", "오늘의 퀘스트", "이 페이지에 대해 알려줄래?"],
    onChoose,
    onAsk,
    bubblePlacement = "left", // "left" | "right"
    frameMs = 400, // idle 1-2-1 속도
    userNickname = "",

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

  // ====== 채팅/버블 상태 ======
  const [input, setInput] = useState("");
  const [view, setView] = useState("menu"); // "menu" | "message" | "aiTopics" // ★
  const [messageText, setMessageText] = useState("");
  const [history, setHistory] = useState([]); // 이전 말풍선 내용 스택
  const [ctaForAi, setCtaForAi] = useState(false); // ★ "AI가 뭐야?" 에만 노출되는 CTA

  // 열릴 때 초기화
  useEffect(() => {
    if (!open) return;
    setView("menu");
    setMessageText("");
    setHistory([]);
    setCtaForAi(false); // ★
  }, [open]);

  function handleAsk() {
    const text = (input || "").trim();
    if (!text) return;
    onAsk?.(text);

    setHistory((h) => [...h, messageText]);
    setMessageText(text);
    setView("message");
    setCtaForAi(false); // ★ 사용자가 직접 친 입력에는 CTA 감춤

    setInput("");
  }

  function getMessageForOption(opt) {
    switch (opt) {
      case "인사하기":
        return `안녕! 나는 겜만중의 도우미봇이야. 우리 사이트에 대해 궁금한게 있으면 편하게 질문해줘. 우리 사이트에 온 걸 환영해, ${userNickname || "방랑자"}!`;
      case "겜만중이 뭐야?":
        return "겜만중은 '게임 만드는 중'의 줄임말이야. AI 기술을 직접 체험하고 학습할 수 있는 AI 체험형 게임 플랫폼이지! 여러 AI를 사용하는 게임과 상호작용을 통해 'AI'와의 상호작용 경험을 할 수 있어.";
      case "AI가 뭐야?":
        // ★ 이 설명 뒤에 '응, 말해줘' CTA가 나타난다
        return "AI는 인공지능이야. 사람처럼 생각하고 대답할 수 있는 프로그램이지. 겜만중에서는 AI가 캐릭터의 성격을 만들고, 네 말을 이해하고, 대화를 이어가고, 게임 요소에도 참여해. 더 자세히 알고 싶다면 아래 버튼을 눌러봐!";
      case "오늘의 퀘스트":
        return "오늘의 퀘스트는 PVE 게임 3회 클리어하기야. 하러 가볼래?";
      case "이 페이지에 대해 알려줄래?":
        return "지금 보고 있는 페이지는 홈페이지야. 홈페이지는 웹페이지의 얼굴이라고 할 수 있지.";
      default:
        return "무엇을 도와줄까?";
    }
  }

  function handleChoose(opt) {
    onChoose?.(opt);
    const next = getMessageForOption(opt);

    setHistory((h) => [...h, messageText]);
    setMessageText(next);
    setView("message");

    // ★ 'AI가 뭐야?'를 선택했을 때만 CTA 버튼 노출
    setCtaForAi(opt === "AI가 뭐야?");
  }

  // ★ '응, 말해줘' → 다음 말풍선(주제 4버튼)으로 이동
  function handleAiMore() {
    setHistory((h) => [...h, messageText]); // 현재 설명을 히스토리에 저장
    setMessageText("궁금한 주제를 골라줘!"); // 안내 문구
    setView("aiTopics");
    setCtaForAi(false);
  }

  // ★ AI 주제 선택 핸들러
  function handlePickAiTopic(topic) {
    const topicMap = {
      "캐릭터 생성":
        "AI가 캐릭터의 ‘성격(페르소나)’과 말투를 만들어. 그래서 같은 질문도 캐릭터마다 다르게 반응하지!",
      "캐릭터 성장":
        "대화와 활동을 통해 캐릭터가 너를 더 잘 이해하고, 퀘스트나 상호작용 성과에 따라 성장해.",
      "AI 활용 게임":
        "AI를 활용한 게임은 총 세가지야. 백엔드의 알고리즘을 통해 게임이 구현되고 AI가 이를 진행 상황을 단순한 수치가 아닌, 생동감 있는 서술형 문장으로 생성하고 있어.  AI가 '해설자' 또는 '스토리텔러' 역할을 맡아 게임 몰입도와 서사를 높여주지!",
      "캐릭터와 채팅":
        "채팅은 단순 응답이 아니라 맥락을 이해하고 이어가는 대화야. 필요한 정보는 기억/요약해서 다음에 더 똑똑해져.",
    };

    const text = topicMap[topic] ?? "준비 중이야!";
    setHistory((h) => [...h, messageText]);

    if (topic === "AI 활용 게임") {
        setMessageText(topicMap["AI 활용 게임"]);
        setView("aiGameModes");     // ★ 새 화면으로
        setCtaForAi(false);
        return;
      }

      setMessageText(text);
      setView("message");
      setCtaForAi(false);
  }

  // 뒤로가기(되돌리기)
  function handleBack() {
    setHistory((h) => {
      if (h.length === 0) {
        setMessageText("");
        setView("menu");
        setCtaForAi(false);
        return h;
      }
      const prev = h[h.length - 1];
      const nextStack = h.slice(0, -1);

      // 'AI가 뭐야?' 설명 문구였는지 간단 판단해 CTA 복구(선택)
      const wasAiExplain =
        typeof prev === "string" && prev.includes("겜만중에서는 AI가");

      setMessageText(prev);
      setView(prev ? "message" : "menu");
      setCtaForAi(!!wasAiExplain);

      return nextStack;
    });
  }

  function handlePickGameMode(mode) {
    setHistory((h) => [...h, messageText]);

    const guide = {
      PVE: "PVE: AI가 스토리텔러가 되어 네 진행을 서사로 풀어줘. 혼자 던전을 탐험해볼래?",
      PVP: "PVP: 상대와 대결! 결과와 하이라이트를 AI가 해설해줘. 매치메이킹으로 이동할까?",
      "AI 토론": "AI 토론: 주제를 정해 AI와 설전을 벌여보자! 관전자 모드 해설도 준비 중이야.",
    };

    setMessageText(guide[mode] || "준비 중이야!");
    setView("message");
    setCtaForAi(false);
  }

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

  // 큰 버튼
  const topicBtnClass =
    "w-full block rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 " +
    "text-sm font-semibold text-zinc-800 shadow-sm transform-gpu transition-all duration-150 " +
    "hover:bg-violet-50 hover:border-violet-300 hover:shadow-lg hover:-translate-y-0.5 " +
    "focus-visible:ring-2 focus-visible:ring-violet-400 " +
    "active:translate-y-0 active:shadow-sm";

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

            {view === "menu" && (
              <>
                <div className="mb-2 text-sm font-semibold text-zinc-700">
                  {name}
                </div>
                <div className="mb-3 text-sm text-zinc-600">
                  무엇을 할까요? 아래 문항을 선택하거나 직접 질문해주세요.
                </div>
                <div className="mb-3 flex flex-wrap gap-2">
                  {options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleChoose(opt)}
                      className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-violet-400"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </>
            )}

            {view === "message" && (
              <>
                <div className="mb-2 text-sm font-semibold text-zinc-700">
                  {name}
                </div>
                <div className="mb-3 whitespace-pre-wrap text-sm text-zinc-700">
                  {messageText}
                </div>

                <div className="mb-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                  >
                    ← 돌아가기
                  </button>

                  {/* ★ 'AI가 뭐야?' 뒤에만 뜨는 CTA */}
                  {ctaForAi && (
                    <button
                      type="button"
                      onClick={handleAiMore}
                      className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md transition hover:bg-violet-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-violet-400"
                    >
                      응, 말해줘
                    </button>
                  )}
                </div>
              </>
            )}

            {/* AI 설명 선택지 */}
            {view === "aiTopics" && (
              <>
                <div className="mb-2 text-sm font-semibold text-zinc-700">
                  {name}
                </div>
                <div className="mb-3 whitespace-pre-wrap text-sm text-zinc-700">
                  {messageText}
                </div>

                {/* 세로 스택: 한 줄 하나 */}
                <div className="mb-3 space-y-2">
                  {["캐릭터 생성", "캐릭터 성장", "AI 활용 게임", "캐릭터와 채팅"].map((topic) => (
                    <button
                      key={topic}
                      onClick={() => handlePickAiTopic(topic)}
                      className={topicBtnClass}
                    >
                      {topic}
                    </button>
                  ))}
                </div>

                {/* 뒤로가기도 크게/한 줄 */}
                <div className="mb-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                  >
                    ← 돌아가기
                  </button>
                </div>
              </>
            )}


            {/* 게임 선택지 */}
            {view === "aiGameModes" && (
              <>
                <div className="mb-2 text-sm font-semibold text-zinc-700">
                  {name}
                </div>
                <div className="mb-3 whitespace-pre-wrap text-sm text-zinc-700">
                  {messageText}
                </div>

                {/* 한 줄에 하나, 큰 버튼 */}
                <div className="mb-3 space-y-2">
                  {["PVE", "PVP", "AI 토론"].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => handlePickGameMode(mode)}
                      className={topicBtnClass}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                <div className="mb-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                  >
                    ← 돌아가기
                  </button>
                </div>
              </>
            )}

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
