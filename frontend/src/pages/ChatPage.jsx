import React, { useState, useRef, useEffect } from "react";

/**
 * SuperSimpleChat.jsx
 * - 테스트 용 초간단 채팅
 * - 좌: AI, 우: 내 메시지
 * - 입력창 하나 + Enter 전송
 * - (옵션) 백엔드 연동: POST /api/chat/send
 */

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8080";

export default function SuperSimpleChat() {
  const [messages, setMessages] = useState([
    { id: "sys-1", role: "assistant", content: "안녕하세요! 테스트 채팅을 시작해 보세요 😊", ts: Date.now() },
  ]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  // 최신 메시지로 스크롤
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = (role, content) => {
    setMessages((prev) => [
      ...prev,
      { id: `${role}-${Date.now()}`, role, content, ts: Date.now() },
    ]);
  };

  const mockAiReply = async (userText) => {
    // 1) 아주 간단한 목업 응답 (지우고 2) 백엔드 연동 사용 가능)
    await new Promise((r) => setTimeout(r, 500));
    return `AI 응답: “${userText}” 에 대한 테스트 답변입니다.`;
  };

  const sendToBackend = async (userText) => {
    // 백엔드에 `/api/chat/send` 있는 경우 이 함수 사용
    const res = await fetch(`${API_BASE}/api/chat/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId: "test", content: userText }),
    });
    if (!res.ok) throw new Error(`send failed ${res.status}`);
    const data = await res.json();
    // 백엔드가 { content: "..." } 형태로 준다고 가정
    return data?.content ?? "(빈 응답)";
  };

  const onSend = async () => {
    const userText = text.trim();
    if (!userText || busy) return;
    setText("");
    addMessage("user", userText);

    setBusy(true);
    try {
      // ※ 둘 중 하나만 사용하세요
      // 1) 목업 응답
      const reply = await mockAiReply(userText);

      // 2) 실제 백엔드 연동
      // const reply = await sendToBackend(userText);

      addMessage("assistant", reply);
    } catch (e) {
      addMessage("assistant", "(오류) 답변 생성에 실패했습니다.");
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="flex h-screen w-full flex-col bg-gray-50">
      <header className="border-b bg-white px-4 py-3 font-semibold">테스트 채팅</header>

      <main className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => (
          <Bubble key={m.id} role={m.role} content={m.content} />
        ))}
        <div ref={endRef} />
      </main>

      <footer className="border-t bg-white p-3">
        <div className="flex gap-2">
          <textarea
            className="flex-1 min-h-[44px] resize-none rounded-xl border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="메시지를 입력하고 Enter로 전송 (줄바꿈: Shift+Enter)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
          />
          <button
            className="rounded-xl bg-blue-600 px-4 text-white shadow hover:bg-blue-700 disabled:opacity-50"
            onClick={onSend}
            disabled={busy || !text.trim()}
          >
            전송
          </button>
        </div>
      </footer>
    </div>
  );
}

function Bubble({ role, content }) {
  const mine = role === "user";
  return (
    <div className={`flex w-full ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2 shadow ${
          mine ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
        }`}
      >
        {content}
      </div>
    </div>
  );
}
