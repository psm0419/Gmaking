import React, { useEffect, useRef, useState, useMemo } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import axiosInstance from "../../api/mypage/axiosInstance";
import useChatExit from "../../hooks/useChatExit";
import { useParams, useLocation, useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_BASE || "";

/** API 경로 */
const API = {
  characters: "/api/chat/characters",
  enter: (cid) => `/api/chat/${cid}/enter`,
  chatSend: (cid) => `/api/chat/${cid}/send`,
};

// 이미지 경로 보정
function toFullImageUrl(raw) {
  let url = raw || "/images/character/placeholder.png";
  if (/^https?:\/\//i.test(url)) return url;
  url = url.replace(/^\/?static\//i, "/");
  url = url.replace(/^\/?character\//i, "/images/character/");
  if (url.startsWith("/")) return url;
  if (url.startsWith("images/")) return `/${url}`;
  return `/images/${url}`;
}

/** 응답 정규화: 서버 스키마가 약간 달라도 흡수 */
function normalizeCharacters(payload) {
  if (!payload) return [];
  const arr = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.characters)
    ? payload.characters
    : Array.isArray(payload.data)
    ? payload.data
    : Array.isArray(payload.list)
    ? payload.list
    : [];
  return arr
    .map((c) => ({
      id: c.id ?? c.characterId ?? c.CHARACTER_ID,
      name: c.name ?? c.characterName ?? c.CHARACTER_NAME,
      imageUrl: c.imageUrl ?? c.profileImageUrl ?? c.IMAGE_URL ?? null,
    }))
    .filter((c) => c.id);
}

/** 히스토리 정규화 */
function normalizeHistory(raw) {
  const arr = Array.isArray(raw) ? raw : [];
  return arr.map((m) => {
    let s = m.sender;
    if (s && typeof s !== "string") s = s.name ?? String(s);
    s = (s || "").toLowerCase();
    const role = s === "user" ? "user" : "assistant";
    return {
      id:
        m.id ??
        m.messageId ??
        `m-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      role,
      content: m.content ?? m.message ?? "",
    };
  });
}

export default function ChatPage() {
  useEffect(() => {
    document.body.classList.add("no-scrollbar");
    document.documentElement.classList.add("no-scrollbar");
    return () => {
      document.body.classList.remove("no-scrollbar");
      document.documentElement.classList.remove("no-scrollbar");
    };
  }, []);

  const { characterId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const enterPayload = location.state?.enterPayload;

  const [characters, setCharacters] = useState([]); // [{id, name, imageUrl}]
  const [selectedIdx, setSelectedIdx] = useState(0);
  const selectedCharacter = useMemo(
    () => (characters.length ? characters[selectedIdx] : null),
    [characters, selectedIdx]
  );

  // 나가기
  useChatExit(selectedCharacter?.id ?? characterId);

  const [messages, setMessages] = useState([]); // [{id, role, content}]
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showTopLoader, setShowTopLoader] = useState(false); // 상단 비주얼 로더 표시 제어
  const [firstPhase, setFirstPhase] = useState(false);
  const endRef = useRef(null);
  const scrollWrapRef = useRef(null);

  const enterOnceRef = useRef({ cid: null, called: false });

  // 스크롤 맨 아래로
  useEffect(() => {
    const el = scrollWrapRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

  /** 1) 초기: 캐릭터 목록 */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(API.characters);

        const list = (Array.isArray(res.data) ? res.data : res.data.characters || []).map(
          (c) => ({
            id: c.id ?? c.characterId,
            name: c.name ?? c.characterName,
            imageUrl: toFullImageUrl(
              c.imageUrl ?? c.profileImageUrl ?? c.imagePath ?? c.imageName
            ),
          })
        );

        setCharacters(list);

        if (list.length) {
          const preferId = characterId?.toString();
          if (preferId) {
            const idx = list.findIndex((c) => String(c.id) === preferId);
            setSelectedIdx(idx >= 0 ? idx : 0);
          } else {
            if (selectedIdx > list.length - 1) setSelectedIdx(0);
          }
        }
      } catch (e) {
        console.error("캐릭터 목록 조회 실패:", e);
        setCharacters([]);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadIdRef = useRef(0);

  /** 2) 캐릭터 전환: enter 호출 */
  useEffect(() => {
    if (!selectedCharacter) {
      setBusy(false);
      setMessages([]);
      return;
    }

    setBusy(false);
    setMessages([]);
    const myLoadId = ++loadIdRef.current;

    setFirstPhase(true);
    setShowTopLoader(true);

    if (
      enterPayload &&
      (enterPayload.characterId === selectedCharacter.id ||
        String(enterPayload.characterId) === String(selectedCharacter.id))
    ) {
      const list = normalizeHistory(enterPayload.history || []).reverse();
      if (myLoadId === loadIdRef.current) {
         setMessages(list);

         const hasAssistant = list.some(m => m.role === "assistant");
         if (hasAssistant) {
           setFirstPhase(false);
           setShowTopLoader(false);
         } else {
          setFirstPhase(true);
          setShowTopLoader(true);
        }
      }
      enterOnceRef.current = { cid: selectedCharacter.id, called: true };
      navigate(".", { replace: true, state: {} });
      return;
    }

    if (enterOnceRef.current.cid !== selectedCharacter.id) {
      enterOnceRef.current = { cid: selectedCharacter.id, called: false };
    }
    if (enterOnceRef.current.called) return;
    enterOnceRef.current.called = true;

    let cancelled = false;
    (async () => {
      try {
        setHistoryLoading(true);
        const { data: enter } = await axiosInstance.post(
          API.enter(selectedCharacter.id)
        );
        const list = normalizeHistory(enter?.history || []).reverse();
        if (!cancelled && myLoadId === loadIdRef.current) {
          setMessages(list);

          const hasAssistant = list.some(m => m.role === "assistant");
          if (hasAssistant) {
             setFirstPhase(false);
             setShowTopLoader(false);
           } else {
            setFirstPhase(true);
            setShowTopLoader(true);
          }
        }
      } catch (e) {
        console.error("대화 이력 조회 실패:", e);
        if (!cancelled)
          setMessages([
            {
              id: "err-" + Date.now(),
              role: "assistant",
              content: "대화 이력을 불러오지 못했어요.",
            },
          ]);
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedCharacter?.id, enterPayload, navigate]);

  useEffect(() => {
   if (firstPhase && messages.some(m => m.role === "assistant")) {
      setFirstPhase(false);
      setShowTopLoader(false);
    }
  }, [messages, firstPhase]);

  /** 타이핑 말풍선 ID 생성 */
  const createTyping = () =>
    `typing-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  /** 3) 메시지 전송 */
  const send = async () => {
    const t = text.trim();
    if (!t || busy || !selectedCharacter) return;

    const cidSnapshot = selectedCharacter.id;
    const uid = "u-" + Date.now();
    const typingId = createTyping();

    setText("");
    // 내 메시지 + 타이핑 말풍선 추가
    setMessages((prev) => [
      ...prev,
      { id: uid, role: "user", content: t },
      { id: typingId, role: "typing", content: "" },
    ]);

    setBusy(true);
    try {
      const { data } = await axiosInstance.post(API.chatSend(cidSnapshot), {
        message: t,
      });
      // 아직 같은 캐릭터면 타이핑 말풍선을 실제 답변으로 교체
      if (cidSnapshot === selectedCharacter?.id) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === typingId
              ? {
                  id: data?.messageId || "a-" + Date.now(),
                  role: "assistant",
                  content: data?.reply ?? "응답이 비어있어요.",
                }
              : m
          )
        );
      }
    } catch (err) {
      console.error("채팅 전송 실패:", err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === typingId
            ? {
                id: "a-" + Date.now(),
                role: "assistant",
                content: "서버 오류가 발생했습니다.",
              }
            : m
        )
      );
    } finally {
      setBusy(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 flex flex-col">
      {/* 로컬 키프레임 */}
      <style>{`
        @keyframes dotJump {
          0%, 60%, 100% { transform: translateY(0); opacity: .6; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
        @keyframes floatBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        /* 점 하나씩 나타났다 사라지는 루프 */
        @keyframes dotAppear {
          0% { opacity: 0; transform: scale(.8); }
          10% { opacity: 1; transform: scale(1); }
          30% { opacity: 1; }
          40%, 100% { opacity: 0; transform: scale(.8); }
        }
      `}</style>

      <Header />

      <div className="flex-1 flex items-center justify-center">
        {/* 중간층 */}
        <div className="w-[1200px] h-[680px] rounded-[48px] bg-slate-950/60 backdrop-blur-sm
                        p-6 shadow-[0_0_0_1px_rgba(0,0,0,0.35),0_30px_80px_-20px_rgba(0,0,0,0.7)]
                        ring-1 ring-black/40 translate-y-8">
          {/* 본문 카드 */}
          <div className="w-full h-full rounded-[36px] bg-slate-700/95 overflow-hidden relative flex ring-1 ring-slate-500/60">
            {/* ===== 사이드바 ===== */}
            <aside className="w-[300px] bg-slate-700 text-slate-100 relative flex flex-col rounded-tl-[36px] rounded-bl-[36px] border-r border-slate-600/70">
              <div className="flex-1 overflow-y-auto pt-10 pb-6 px-2 relative z-10 no-scrollbar">
                {loading ? (
                  <div className="text-sm text-slate-300 text-center">로드 중…</div>
                ) : characters.length === 0 ? (
                  <div className="px-4 text-center text-slate-300 text-sm">
                    캐릭터가 없어요.
                    <br />
                    마이페이지에서 생성해 주세요.
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-6 pr-2">
                    {characters.map((c, idx) => (
                      <AvatarItem
                        key={c.id}
                        selected={selectedIdx === idx}
                        onClick={() => setSelectedIdx(idx)}
                        imageUrl={c.imageUrl}
                        name={c.name}
                      />
                    ))}
                  </div>
                )}
              </div>
            </aside>

            {/* ===== 채팅 본문 ===== */}
            <section className="flex-1 flex flex-col bg-slate-600/40">
              {/* 상단 바 */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-600/70">
                <div className="font-semibold text-lg text-slate-100">
                  {selectedCharacter ? selectedCharacter.name : "캐릭터"}
                </div>
                {/* 기존 텍스트 로더 대신 비주얼 로더를 상단 아래에 별도 표시 */}
              </div>

              {/* 상단 비주얼 로더 */}
              {firstPhase && <TopVisualLoader />}

              {/* 채팅 영역 */}
              <div
                key={selectedCharacter?.id || "none"}
                ref={scrollWrapRef}
                className="flex-1 overflow-y-auto no-scrollbar px-8 md:px-14 py-6 md:py-8 space-y-5"
              >
                {messages.map((m) =>
                  m.role === "typing" ? (
                    <TypingBubble key={m.id} />
                  ) : (
                    <Bubble key={m.id} role={m.role} content={m.content} />
                  )
                )}
                <div ref={endRef} />
              </div>

              {/* 입력창 */}
              <div className="border-t border-slate-600/70 px-8 md:px-14 py-6 bg-slate-700/60">
                <div className="flex items-end gap-4">
                  <textarea
                    className="flex-1 min-h-[56px] max-h-[140px] resize-none rounded-3xl
                               border border-slate-600 bg-slate-800/80 text-slate-100 placeholder:text-slate-400
                               px-6 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all duration-200"
                    placeholder={
                      selectedCharacter ? "메시지 입력" : "캐릭터를 먼저 선택하세요"
                    }
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={onKeyDown}
                    disabled={!selectedCharacter}
                  />
                  <button
                    className="h-[56px] min-w-[100px] rounded-3xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700
                               text-white text-xl font-medium shadow-sm ring-1 ring-violet-700/30
                               disabled:bg-slate-600 disabled:text-white/60"
                    onClick={send}
                    disabled={!text.trim() || busy || !selectedCharacter}
                  >
                    {busy ? (
                      <div
                        className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full mx-auto"
                        role="status"
                        aria-label="loading"
                      />
                    ) : (
                      "전송"
                    )}
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

/** ======================= 상단 비주얼 로더 ======================= */
function TopVisualLoader() {
  return (
    <div className="px-6 md:px-8 py-3">
      <div className="w-full rounded-2xl border border-slate-600/60 bg-slate-700/60 px-4 py-3 flex items-center gap-4">
        {/* 아이콘: 편지가 통통 */}
        <div
          className="w-9 h-9 rounded-full bg-slate-200 text-slate-800 grid place-items-center"
          style={{ animation: "floatBounce 1.4s ease-in-out infinite" }}
          aria-hidden
        >
          {/* 편지 아이콘 (CSS-only) */}
          <div className="relative w-5 h-3 bg-slate-800/90 rounded-sm">
            <div className="absolute inset-0" style={{
              clipPath: "polygon(0 0, 100% 0, 50% 60%)",
              background: "rgba(255,255,255,.9)"
            }}/>
          </div>
        </div>

        {/* 텍스트 + 점 애니메이션 */}
        <div className="flex-1">
          <div className="text-slate-100 text-sm md:text-base font-medium">
            캐릭터가 인삿말을 고르는 중
            <span className="inline-flex items-center ml-1">
              <Dot delay="0ms" />
              <Dot delay="200ms" />
              <Dot delay="400ms" />
            </span>
          </div>
          <div className="text-slate-300/80 text-xs mt-1">
            첫 응답을 준비하고 있어요. 잠시만 기다려 주세요.
          </div>
        </div>
      </div>
    </div>
  );
}

function Dot({ delay = "0ms" }) {
  return (
    <span
      className="inline-block w-1.5 h-1.5 mx-[2px] rounded-full bg-slate-300"
      style={{ animation: "dotAppear 1.2s linear infinite", animationDelay: delay }}
    />
  );
}

/** ======================= 아바타 아이템 ======================= */
function AvatarItem({ selected = false, onClick, imageUrl, name }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative w-[220px] h-[110px] rounded-2xl transition-all
                ${selected
                  ? "bg-slate-600 ring-2 ring-amber-400"
                  : "bg-slate-800 hover:bg-slate-700"}`}
      title={name}
    >
      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-[72px] h-[72px] rounded-full bg-slate-900 ring-2 ring-slate-500 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name || "character"}
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-slate-400 text-xs">
            No Image
          </div>
        )}
      </div>
      <div className="absolute left-[100px] right-3 top-1/2 -translate-y-1/2">
        <div className={`line-clamp-2 text-left text-sm font-medium ${
          selected ? "text-amber-300" : "text-slate-100/90"
        }`}>
          {name}
        </div>
        <div className="text-[11px] text-slate-300 mt-1">클릭하여 전환</div>
      </div>
    </button>
  );
}

/** ======================= 채팅 말풍선 ======================= */
function Bubble({ role, content }) {
  const mine = role === "user";
  const bubble = mine ? "bg-violet-600 text-white" : "bg-slate-200 text-slate-900";

  return (
    <div className={`flex w-full ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative max-w-[70%] whitespace-pre-wrap break-words rounded-[18px] px-4 py-2 shadow-sm ${bubble}`}
      >
        {content}

        {/* 꼬리 */}
        {mine ? (
          <div
            className="absolute w-0 h-0 right-[-7px] border-t-[6px] border-b-[6px] border-l-[8px]
                       border-t-transparent border-b-transparent border-l-violet-600"
            style={{ top: "16px" }}
          />
        ) : (
          <>
            <div
              className="absolute w-0 h-0 left-[-10px] top-1/2 -translate-y-1/2
                         border-t-[8px] border-b-[8px] border-r-[12px]
                         border-t-transparent border-b-transparent border-r-slate-200"
            />
            <div
              className="absolute left-[-2px] top-1/2 -translate-y-1/2
                         w-3 h-3 bg-slate-200 rounded-bl-[12px]"
              style={{ clipPath: "polygon(0% 0%, 100% 50%, 0% 100%)" }}
            />
          </>
        )}
      </div>
    </div>
  );
}

/** ============== 타이핑 말풍선(… 점프 애니메이션) ============== */
function TypingBubble() {
  return (
    <div className="flex w-full justify-start">
      <div className="relative max-w-[70%] rounded-[18px] px-4 py-2 shadow-sm bg-slate-200 text-slate-900">
        <div className="flex items-center gap-1 h-5" aria-label="AI가 입력 중">
          <span className="inline-block w-2 h-2 rounded-full bg-slate-500"
                style={{ animation: "dotJump 1.2s infinite", animationDelay: "0ms" }} />
          <span className="inline-block w-2 h-2 rounded-full bg-slate-500"
                style={{ animation: "dotJump 1.2s infinite", animationDelay: "150ms" }} />
          <span className="inline-block w-2 h-2 rounded-full bg-slate-500"
                style={{ animation: "dotJump 1.2s infinite", animationDelay: "300ms" }} />
        </div>

        {/* 캐릭터(assistant) 꼬리 */}
        <div
          className="absolute w-0 h-0 left-[-10px] top-1/2 -translate-y-1/2
                     border-t-[8px] border-b-[8px] border-r-[12px]
                     border-t-transparent border-b-transparent border-r-slate-200"
        />
        <div
          className="absolute left-[-2px] top-1/2 -translate-y-1/2
                     w-3 h-3 bg-slate-200 rounded-bl-[12px]"
          style={{ clipPath: "polygon(0% 0%, 100% 50%, 0% 100%)" }}
        />
      </div>
    </div>
  );
}
