
import React, { useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { motion } from "framer-motion";
import GuideViewer from "./GuideViewer";
import usePageGuide from "./UsePageGuide";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm"
import remarkBreaks from "remark-breaks";

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
    images = ["/images/character/idle.png"],
    name = "도우미",
    options = ["인사하기", "겜만중이 뭐야?", "AI가 뭐야?", "오늘의 퀘스트", "이 페이지에 대해 알려줄래?"],
    onChoose,
    onAsk,
    bubblePlacement = "left",
    frameMs = 400,
    userNickname = "",

    blinkFrameMs = 120,
    blinkMinMs = 3000,
    blinkMaxMs = 6000,

    open: openProp,
    onOpenChange,

    introImages = [],
    introFrameMs = 500,
    playIntroOnEveryOpen = true,
    introOnMount = false,

    onGoToPVE,
    onGoToPVP,
    onGoToDebate,
    onGoToChat,
  },
  ref
) {
  const guideMeta = usePageGuide();
  const [pageCta, setPageCta] = useState(null);
  const isSequence = images.length > 1;
  const isIntroSeq = Array.isArray(introImages) && introImages.length > 0;

  // open state (controlled/uncontrolled)
  const [openUncontrolled, setOpenUncontrolled] = useState(false);
  const open = openProp ?? openUncontrolled;
  const setOpen = (v) => {
    const next = typeof v === "function" ? v(open) : v;
    onOpenChange?.(next);
    if (openProp === undefined) setOpenUncontrolled(next);
  };

  // ===== Idle/Blink FSM =====
  const [frame, setFrame] = useState(0);
  const loopRef = useRef(null);
  const blinkRef = useRef(null);
  const nextBlinkRef = useRef(null);

  function clearAllTimers() {
    clearInterval(loopRef.current);
    clearInterval(blinkRef.current);
    clearTimeout(nextBlinkRef.current);
  }
  function startIdleLoop() {
    const seq = [0, 1, 0];
    let i = 0;
    loopRef.current = setInterval(() => {
      setFrame(seq[i]);
      i = (i + 1) % seq.length;
    }, frameMs);
  }
  function scheduleNextBlink() {
    const gap = Math.floor(Math.random() * (blinkMaxMs - blinkMinMs)) + blinkMinMs;
    nextBlinkRef.current = setTimeout(() => {
      const seq = [1, 2, 3, 0];
      let i = 0;
      clearInterval(loopRef.current);
      blinkRef.current = setInterval(() => {
        setFrame(seq[i]);
        i++;
        if (i >= seq.length) {
          clearInterval(blinkRef.current);
          startIdleLoop();
          scheduleNextBlink();
        }
      }, blinkFrameMs);
    }, gap);
  }

  const bubbleRef = useRef(null);
  useOutsideClick(bubbleRef, () => setOpen(false));

  const placementClass = useMemo(
    () => (bubblePlacement === "right" ? "left-full ml-3 origin-left" : "right-full mr-3 origin-right"),
    [bubblePlacement]
  );

  // intro phase
  const [didIntroOnce, setDidIntroOnce] = useState(false);
  const [phase, setPhase] = useState(introOnMount ? "intro" : "idle");
  const [introFrame, setIntroFrame] = useState(0);

  useEffect(() => {
    if (introOnMount && isIntroSeq) {
      setPhase("intro");
      setIntroFrame(0);
    }
  }, [introOnMount, isIntroSeq]);

  useEffect(() => {
    if (!open) return;
    if (isIntroSeq && (playIntroOnEveryOpen || !didIntroOnce)) {
      setPhase("intro");
      setDidIntroOnce(true);
      clearAllTimers();
    } else {
      setPhase("idle");
    }
  }, [open, isIntroSeq, playIntroOnEveryOpen, didIntroOnce]);

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

  useEffect(() => {
    if (!isSequence || phase !== "idle") return;
    clearAllTimers();
    startIdleLoop();
    scheduleNextBlink();
    return clearAllTimers;
  }, [isSequence, phase, frameMs, blinkFrameMs, blinkMinMs, blinkMaxMs]);

  const currentSrc = phase === "intro" ? (isIntroSeq ? introImages[introFrame] : images[0] ?? "") : isSequence ? images[frame] : images[0];

  // cross-fade
  const [displaySrc, setDisplaySrc] = useState(currentSrc);
  const [prevSrc, setPrevSrc] = useState(null);
  useEffect(() => {
    if (currentSrc === displaySrc) return;
    setPrevSrc(displaySrc);
    setDisplaySrc(currentSrc);
    const t = setTimeout(() => setPrevSrc(null), 260);
    return () => clearTimeout(t);
  }, [currentSrc, displaySrc]);

  // preload
  useEffect(() => {
    [...introImages, ...images].forEach((src) => {
      const im = new Image();
      im.src = src;
    });
  }, [introImages, images]);

  // ===== chat/bubble state =====
  const [input, setInput] = useState("");
  const [view, setView] = useState("menu"); // "menu" | "message" | "aiTopics" | "aiGameModes"
  const [messageText, setMessageText] = useState("");
  const [history, setHistory] = useState([]);
  const [ctaForAi, setCtaForAi] = useState(false);

  // === Guide (동적 import) ===
  const [showGuide, setShowGuide] = useState(false);
  const [guideData, setGuideData] = useState(null); // { title, pages, __key }
  const [loadingGuide, setLoadingGuide] = useState(false);
  const [errGuide, setErrGuide] = useState(null);

  async function openGuide(key) {
    try {
      setLoadingGuide(true);
      setErrGuide(null);
      const mod = await import("./GuideContent.js");
      const content = (mod.default || mod.GUIDE_CONTENT);
      const picked = content?.[key];
      if (!picked) throw new Error(`가이드 "${key}"를 찾을 수 없습니다.`);
      setGuideData({ ...picked, __key: key });
      setShowGuide(true);
    } catch (e) {
      setErrGuide(e.message ?? String(e));
    } finally {
      setLoadingGuide(false);
    }
  }

  function closeGuide() {
    setShowGuide(false);
    setGuideData(null);
  }

  // 열릴 때 초기화
  useEffect(() => {
    if (!open) return;
    setView("menu");
    setMessageText("");
    setHistory([]);
    setCtaForAi(false);
    setPageCta(null);
  }, [open]);

  function handleAsk() {
    const text = (input || "").trim();
    if (!text) return;
    onAsk?.(text);
    setHistory((h) => [...h, messageText]);
    setMessageText(text);
    setView("message");
    setCtaForAi(false);
    setInput("");
  }


  function getMessageForOption(opt) {
    switch (opt) {
      case "인사하기":
        return `안녕! 나는 겜만중의 도우미봇이야.
        우리 사이트는 AI를 사용한 게임 사이트이자 AI를 체험하는 학습 사이트이기도 하기때문에 일반인도 쉽게 활용된 AI를 설명하는 역할을 개발자들이 나한테 맡겼어.
        어떤 AI 모델이 사용되었는지, 이 페이지가 어떤 페이지인지 궁금할때마다 날 떠올려줘!
        그럼 즐거운 시간되고, 다시 한 번 만나서 반가워! ${userNickname || "방랑자"}!`;
      case "겜만중이 뭐야?":
        return `겜만중은 **게임 만드는 중**의 줄임말이야. AI 기술을 직접 체험하고 학습할 수 있는 AI 체험형 게임 플랫폼이지!
        우리 사이트에서는 AI로 캐릭터를 생성하기도 하고, 성장시키기도하고, 게임도 하고 채팅도 하면서 AI를 실제 체험할 수 있어!
        혹시 사이트를 둘러보다가 궁금한 점이 생기면 **이 페이지는 뭐야?** 를 클릭하거나 질문을 입력해줘!`;
      case "AI가 뭐야?":
        return `AI는 간단하게 말해서 사람처럼 스스로 사고하고 판단 할 수 있도록 만든 인공지능이야. 사람들이 가장 많이 접하는 건 아무래도 쳇지피티겠지? 쳇지티 알아?
        사실 우리 사이트에서도 쳇지피티를 이용해 많은 것을 하고 있어. 우리 겜만중에서는 직접 학습한 AI 모델부터 시중에 존재하는 AI를 활용해서 캐릭터를 생성하고, 성장시키고, 게임을 하고, 대화를 할 수 있어. 여러 컨텐츠를 즐기면서 다재다능한 AI가 어떤 식으로 활용되는지 봐줘.
        우리 사이트에서 AI가 쓰인 컨텐츠에대해 좀 더 자세히 알고 싶어?`;
      case "오늘의 퀘스트":
        return "오늘의 퀘스트는 PVE 게임 3회 클리어하기야. 하러 가볼래?";
      case "이 페이지에 대해 알려줄래?":
        setPageCta(guideMeta?.cta ?? null);
        return guideMeta?.text ?? "이 페이지에 대한 설명을 아직 준비하지 못했어요.";
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
    setCtaForAi(opt === "AI가 뭐야?");
  }

  function handleAiMore() {
    setHistory((h) => [...h, messageText]);
    setMessageText("궁금한 주제를 골라줘!");
    setView("aiTopics");
    setCtaForAi(false);
  }

  function handlePickAiTopic(topic) {
    const topicMap = {
      "캐릭터 생성": "AI가 캐릭터의 ‘성격(페르소나)’과 말투를 만들어. 캐릭터마다 반응이 달라!",
      "캐릭터 성장": "대화/활동으로 캐릭터가 널 더 잘 이해하고 성장해.",
      "AI 활용 게임": "AI는 해설자/스토리텔러 역할을 맡아 서사와 몰입도를 높여줘.",
      "캐릭터와 채팅": "단순 응답이 아니라 맥락을 이해하고 이어가는 대화야. 필요한 정보는 기억/요약해 다음에 더 똑똑해져.",
    };

    const text = topicMap[topic] ?? "준비 중이야!";
    setHistory((h) => [...h, messageText]);

    if (topic === "캐릭터와 채팅") {
          setMessageText(topicMap["캐릭터와 채팅"]);
          setView("message");
          setCtaForAi(false);
          openGuide("chat");             // ← 추가
          return;
    }

    if (topic === "AI 활용 게임") {
      setMessageText(topicMap["AI 활용 게임"]);
      setView("aiGameModes");
      setCtaForAi(false);
      return;
    }

    setMessageText(text);
    setView("message");
    setCtaForAi(false);
  }

  function handleBack() {
    setHistory((h) => {
      if (h.length === 0) {
        setMessageText("");
        setView("menu");
        setCtaForAi(false);
        setPageCta(null);
        return h;
      }
      const prev = h[h.length - 1];
      const nextStack = h.slice(0, -1);
      const wasAiExplain = typeof prev === "string" && prev.includes("겜만중에서는");
      setMessageText(prev);
      setView(prev ? "message" : "menu");
      setCtaForAi(!!wasAiExplain);
      return nextStack;
    });
  }

  function handlePickGameMode(mode) {
    setHistory((h) => [...h, messageText]);

    const guide = {
      PVE: "PVE: AI가 스토리텔러가 되어 네 진행을 서사로 풀어줘.",
      PVP: "PVP: 상대와 대결! 결과와 하이라이트를 AI가 해설해줘.",
      "AI 토론": "AI 토론: 주제를 정해 AI와 설전을 벌여보자!",
    };

    setMessageText(guide[mode] || "준비 중이야!");
    setView("message");
    setCtaForAi(false);

    if (mode === "PVE") openGuide("pve");
    if (mode === "PVP") openGuide("pvp");
    if (mode === "AI 토론") openGuide("debate");
  }

  useImperativeHandle(ref, () => ({
    open: () => setOpen(true),
    close: () => setOpen(false),
    toggle: () => setOpen((v) => !v),
    isOpen: () => !!open,
  }));

  // animation presets
  const isIntroFirst = phase === "intro" && introFrame === 0;
  const currentInitial = isIntroFirst ? { opacity: 0, scale: 0.7, y: 0 } : { opacity: 0, scale: 1, y: 0 };
  const currentAnimate = isIntroFirst ? { opacity: 1, scale: [0.7, 1.1, 1], y: 0 } : { opacity: 1, scale: [1, 1.02, 1], y: 0 };
  const currentDuration = isIntroFirst ? 0.6 : 0.24;

  const topicBtnClass =
    "w-full block rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-800 shadow-sm transform-gpu transition-all duration-150 hover:bg-violet-50 hover:border-violet-300 hover:shadow-lg hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-violet-400 active:translate-y-0 active:shadow-sm";

  const GO_LABELS = { pve: "PVE 하러가기", pvp: "PVP 하러가기", debate: "AI 토론 하러가기" };
  function handleGo(key) {
    const handlers = { pve: onGoToPVE, pvp: onGoToPVP, debate: onGoToDebate };
    const fallbacks = { pve: "/pve/maps", pvp: "/pvp/match", debate: "/debate" };
    const fn = handlers[key];
    if (typeof fn === "function") return fn();
    window.location.href = fallbacks[key] || "/";
  }

  return (
    <div className="fixed bottom-6 right-6 z-[60] select-none">
      {/* Character */}
      <button type="button" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="group relative block focus:outline-none">
        <div className="relative h-40 w-40 overflow-hidden">
          {prevSrc && (
            <motion.img
              src={prevSrc}
              alt=""
              className="absolute inset-0 h-full w-full object-contain drop-shadow-xl pointer-events-none"
              style={{ transformOrigin: "50% 100%", willChange: "opacity, transform", transform: "translateZ(0)" }}
              initial={{ opacity: 1, scale: 1, y: 0 }}
              animate={{ opacity: 0, scale: 1, y: 0 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
            />
          )}
          <motion.img
            src={displaySrc}
            alt={`${name} 캐릭터`}
            className="absolute inset-0 h-full w-full object-contain drop-shadow-xl pointer-events-none"
            style={{ transformOrigin: "50% 100%", willChange: "opacity, transform", transform: "translateZ(0)" }}
            initial={currentInitial}
            animate={phase === "idle" ? { opacity: 1, scale: 1, y: 0 } : currentAnimate}
            transition={phase === "idle" ? { duration: 0 } : { duration: currentDuration, ease: "easeOut" }}
            whileHover={phase !== "intro" ? { rotate: [0, -2, 2, 0] } : undefined}
          />
        </div>
        <span className="pointer-events-none absolute -top-2 -right-2 rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-semibold text-white shadow-lg">online</span>
        <span className="sr-only">{name}</span>
      </button>

      {/* Bubble */}
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
            <div className={`absolute bottom-2 ${bubblePlacement === "right" ? "-left-2" : "-right-2"} h-4 w-4 rotate-45 border border-zinc-200 bg-white/95`} aria-hidden />
            {view === "menu" && (
              <>
                <div className="mb-2 text-sm font-semibold text-zinc-700">{name}</div>
                <div className="mb-3 text-sm text-zinc-600">무엇을 할까요? 아래 문항을 선택하거나 직접 질문해주세요.</div>
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
                <div className="mb-2 text-sm font-semibold text-zinc-700">{name}</div>
                <div className="mb-3 text-sm text-zinc-700 prose prose-zinc max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkBreaks]}
                    components={{
                     p: (props) => <p className="mb-2 last:mb-0 whitespace-pre-wrap" {...props} />,
                      strong: (props) => <strong className="font-semibold" {...props} />,
                      a: (props) => <a className="text-violet-600 underline" {...props} />
                    }}
                  >
                    {messageText}
                  </ReactMarkdown>
                </div>
                <div className="mb-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                  >
                    ← 돌아가기
                  </button>
                  {ctaForAi && (
                    <button
                      type="button"
                      onClick={handleAiMore}
                      className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md transition hover:bg-violet-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-violet-400"
                    >
                      응, 말해줘
                    </button>
                  )}

                  {pageCta?.label && (
                    <button
                       type="button"
                       onClick={() => {
                         if (pageCta.action === "openGuide" && pageCta.key) {
                           openGuide(pageCta.key);
                         }
                       }}
                       className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                    >
                      {pageCta.label}
                    </button>
                  )}


                </div>
              </>
            )}

            {view === "aiTopics" && (
              <>
                <div className="mb-2 text-sm font-semibold text-zinc-700">{name}</div>
                <div className="mb-3 text-sm text-zinc-700">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkBreaks]}
                    components={{
                        p: (props) => <p className="mb-2 last:mb-0 whitespace-pre-wrap" {...props} />,
                        strong: (props) => <strong className="font-semibold" {...props} />,
                        a: (props) => <a className="text-violet-600 underline" {...props} />
                    }}
                  >
                    {messageText}
                  </ReactMarkdown>
                </div>
                <div className="mb-3 space-y-2">
                  {["캐릭터 생성", "캐릭터 성장", "AI 활용 게임", "캐릭터와 채팅"].map((topic) => (
                    <button key={topic} onClick={() => handlePickAiTopic(topic)} className={topicBtnClass}>
                      {topic}
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

            {view === "aiGameModes" && (
              <>
                <div className="mb-2 text-sm font-semibold text-zinc-700">{name}</div>
                <div className="mb-3 text-sm text-zinc-700">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkBreaks]}
                    components={{
                      p: (props) => <p className="mb-2 last:mb-0 whitespace-pre-wrap" {...props} />,
                      strong: (props) => <strong className="font-semibold" {...props} />,
                      a: (props) => <a className="text-violet-600 underline" {...props} />
                    }}
                  >
                    {messageText}
                  </ReactMarkdown>
                </div>

                <div className="mb-3 space-y-2">
                  {["PVE", "PVP", "AI 토론"].map((mode) => (
                    <button key={mode} onClick={() => handlePickGameMode(mode)} className={topicBtnClass}>
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

      {/* 가이드 모달 */}
      {showGuide && guideData && (
        <GuideViewer
          guide={guideData}
          onClose={closeGuide}
          onGo={(key) => {
            const map = {
                pve: onGoToPVE,
                pvp: onGoToPVP,
                debate: onGoToDebate,
                chat: onGoToChat,
            };
            if (typeof map[key] === "function") return map[key]();
            const fallback = {
                pve: "/pve/maps",
                pvp: "/pvp/match",
                debate: "/debate",
                chat: "/chat-entry",
            }[key] || "/";
            window.location.href = fallback;
          }}
        />
      )}

      {errGuide && <div className="mt-2 text-sm text-red-600">가이드를 불러오지 못했습니다: {errGuide}</div>}
      {loadingGuide && <div className="mt-2 text-sm text-zinc-500">가이드 불러오는 중…</div>}
    </div>
  );
});
