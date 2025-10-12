import React, { useEffect, useRef, useState, useMemo } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import axiosInstance from "../api/axiosInstance";
import { useParams } from "react-router-dom";

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:8080";

/** API 경로 */

const API = {
  characters: "/chat/characters",
  history: (cid) => `/chat/${cid}/history`,
  chatSend: (cid) => `/chat/${cid}/send`,
};

// 이미지 경로 보정
function toFullImageUrl(raw) {
  const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:8080";
  let url = raw || "/images/character/placeholder.png";

  // 이미 절대 URL이면 그대로
  if (/^https?:\/\//i.test(url)) return url;

  // 1) /static/ 접두어 제거
  url = url.replace(/^\/?static\//i, "/");

  // 2) /character/ → /images/character/ 로 정규화
  url = url.replace(/^\/?character\//i, "/images/character/");

  // 3) 루트(/)로 시작하면 호스트만 붙임
  if (url.startsWith("/")) return `${API_BASE}${url}`;

  // 4) images/ 로 시작하면 / 하나 붙여서 호스트 결합
  if (url.startsWith("images/")) return `${API_BASE}/${url}`;

  // 5) 파일명만 온 경우 기본 폴더(images) 붙이기
  return `${API_BASE}/images/${url}`;
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

export default function ChatPage() {
  const { characterId } = useParams();

  const [characters, setCharacters] = useState([]); // [{id, name, imageUrl}]
  const [selectedIdx, setSelectedIdx] = useState(0);
  const selectedCharacter = useMemo(
    () => (characters.length ? characters[selectedIdx] : null),
    [characters, selectedIdx]
  );

  const [messages, setMessages] = useState([]); // [{id, role, content}]
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const endRef = useRef(null);

  //히스토리 정규화 함수
  function normalizeHistory(raw) {
      const arr = Array.isArray(raw) ? raw : [];
      return arr.map((m) => {
        let s = m.sender;
        if (s && typeof s !== "string") s = s.name ?? String(s);
        s = (s || "").toLowerCase();

        const role = s === "user" ? "user" : "assistant";
        return {
          id: m.id ?? m.messageId ?? `m-${Date.now()}`,
          role,
          content: m.content ?? m.message ?? "",
        };
      });
  }
  // 스크롤 맨 아래로
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /** 1) 초기: 캐릭터 목록 */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(API.characters);

        const list = (Array.isArray(res.data) ? res.data : res.data.characters || []).map((c) => ({
                  id: c.id ?? c.characterId,
                  name: c.name ?? c.characterName,
                  imageUrl: toFullImageUrl(
                    c.imageUrl ?? c.profileImageUrl ?? c.imagePath ?? c.imageName
                  ),
                }));

        setCharacters(list);
        // 인덱스가 범위를 벗어나지 않게 보정
        if (list.length) {
          const preferId = characterId?.toString();
          if (preferId) {
            const idx = list.findIndex((c) => String(c.id) === preferId);
            setSelectedIdx(idx >= 0 ? idx : 0);
          } else {
            // 파라미터 없으면 기존 보정 로직
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

  /** 2) 캐릭터 전환: 히스토리 로딩, 없으면 기본 인사 */
  useEffect(() => {
    if (!selectedCharacter) {
      setMessages([]);
      return;
    }
    (async () => {
      try {
        setHistoryLoading(true);

        // 히스토리 불러오기
        const { data: hist } = await axiosInstance.get(
          API.history(selectedCharacter.id)
        );
        const list = normalizeHistory(hist);
        list.reverse();
        setMessages(list);

        // 히스토리가 비어 있으면 기본 인사 추가
        if (list.length === 0) {
          setMessages((prev) => [
            ...prev,
            {
              id: "greet-" + Date.now(),
              role: "assistant",
              content: `안녕! 나는 ${selectedCharacter.name}. 오늘은 어땠어?`,
            },
          ]);
        }
      } catch (e) {
        console.error("대화 이력 조회 실패:", e);
        setMessages([
          {
            id: "err-" + Date.now(),
            role: "assistant",
            content: "대화 이력을 불러오지 못했어요.",
          },
        ]);
      } finally {
        setHistoryLoading(false);
      }
    })();
  }, [selectedCharacter?.id]);

  /** 3) 메시지 전송 */
  const send = async () => {
    const t = text.trim();
    if (!t || busy || !selectedCharacter) return;

    const uid = "u-" + Date.now();
    setText("");
    setMessages((prev) => [...prev, { id: uid, role: "user", content: t }]);

    setBusy(true);
    try {
      const { data } = await axiosInstance.post(
        API.chatSend(selectedCharacter.id),
        { message: t }
      );
      setMessages((prev) => [
        ...prev,
        {
          id: data?.messageId || "a-" + Date.now(),
          role: "assistant",
          content: data?.reply ?? "응답이 비어있어요.",
        },
      ]);
    } catch (err) {
      console.error("채팅 전송 실패:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: "a-" + Date.now(),
          role: "assistant",
          content: "서버 오류가 발생했습니다.",
        },
      ]);
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
    <div className="min-h-screen w-full bg-gray-200/70 flex flex-col font-sans">
      <Header />

      <div className="flex-1 flex items-center justify-center">
        <div className="w-[1200px] h-[680px] rounded-[48px] bg-gray-300/60 p-6 shadow-inner">
          <div className="w-full h-full rounded-[36px] bg-white overflow-hidden relative flex">
            {/* ===== 사이드바 ===== */}
            <aside className="w-[300px] bg-neutral-700 text-white relative overflow-hidden isolate">
              <div className="absolute inset-y-0 left-[-60px] w-[60px] bg-neutral-700 rounded-l-[48px]" />
              <div className="flex flex-col items-center pt-10 gap-6">
                {loading ? (
                  <div className="text-sm text-neutral-300">로드 중…</div>
                ) : characters.length === 0 ? (
                  <div className="px-4 text-center text-neutral-300 text-sm">
                    캐릭터가 없어요.
                    <br />
                    마이페이지에서 생성해 주세요.
                  </div>
                ) : (
                  characters.map((c, idx) => (
                    <AvatarItem
                      key={c.id}
                      selected={selectedIdx === idx}
                      onClick={() => setSelectedIdx(idx)}
                      imageUrl={c.imageUrl}
                      name={c.name}
                    />
                  ))
                )}
              </div>
            </aside>

            {/* ===== 채팅 본문 ===== */}
            <section className="flex-1 flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <div className="font-semibold text-lg">
                  {selectedCharacter ? selectedCharacter.name : "캐릭터"}
                </div>
                {historyLoading && (
                  <div className="text-sm text-gray-500">대화 불러오는 중…</div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto px-14 py-10 space-y-5">
                {messages.map((m) => (
                  <Bubble key={m.id} role={m.role} content={m.content} />
                ))}
                <div ref={endRef} />
              </div>

              {/* ===== 입력창 ===== */}
              <div className="border-t px-14 py-6 bg-white">
                <div className="flex items-end gap-4">
                  <textarea
                    className="flex-1 min-h-[56px] max-h-[140px] resize-none rounded-3xl border border-gray-300 px-6 py-4 text-lg
                               focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                    placeholder={
                      selectedCharacter ? "메시지 입력" : "캐릭터를 먼저 선택하세요"
                    }
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={onKeyDown}
                    disabled={!selectedCharacter}
                  />
                  <button
                    className="h-[56px] min-w-[100px] rounded-3xl bg-gray-200 hover:bg-gray-300 active:bg-gray-400
                               text-gray-900 text-xl font-medium shadow-sm transition-colors
                               disabled:bg-gray-100 disabled:text-gray-400"
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

/** ======================= 아바타 아이템 ======================= */
function AvatarItem({ selected = false, onClick, imageUrl, name }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative w-[220px] h-[110px] rounded-2xl transition-all
                  ${selected ? "bg-neutral-600 ring-2 ring-white/40" : "bg-neutral-800 hover:bg-neutral-700"}`}
      title={name}
    >
      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-[72px] h-[72px] rounded-full bg-white ring-2 ring-neutral-500 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name || "character"}
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-neutral-400 text-xs">
            No Image
          </div>
        )}
      </div>
      <div className="absolute left-[100px] right-3 top-1/2 -translate-y-1/2">
        <div className="line-clamp-2 text-left text-sm font-medium text-white/90">
          {name}
        </div>
        <div className="text-[11px] text-white/50 mt-1">클릭하여 전환</div>
      </div>
    </button>
  );
}

/** ======================= 채팅 말풍선 ======================= */
function Bubble({ role, content }) {
  const mine = role === "user";
  const bubble = mine ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900";

  return (
    <div className={`flex w-full ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative max-w-[70%] whitespace-pre-wrap break-words rounded-[18px] px-4 py-2 shadow-sm ${bubble}`}
      >
        {content}
        <div
          className={`absolute w-0 h-0 border-t-[6px] border-b-[6px] ${
            mine
              ? "right-[-7px] border-l-[8px] border-l-blue-500"
              : "left-[-7px] border-r-[8px] border-r-gray-100"
          } border-t-transparent border-b-transparent`}
          style={{ top: "16px" }}
        />
      </div>
    </div>
  );
}
