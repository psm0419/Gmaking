// src/pages/MyPage.jsx
import React, { useEffect, useRef, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { getMyPageSummary } from "../api/myPageApi";
import { useNavigate } from "react-router-dom";

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

/** 페이지 래퍼: 헤더 / 메인 / 푸터 */
export default function MyPage() {
  const handlePick = () => {
    alert("뽑으러가기!");
  };

  // 서버 데이터 상태
  const [profile, setProfile] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 로그인(토큰) 여부만 체크
  useEffect(() => {
    const token = localStorage.getItem("gmaking_token");
    if (!token) {
      alert("로그인 정보가 없습니다. 로그인 페이지로 이동합니다.");
      window.location.href = "/login";
    }
  }, []);

  // 마이페이지 데이터 로드
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        // ✅ userId를 보내지 않습니다. (백엔드가 JWT에서 추출)
        const res = await getMyPageSummary(6);
        const data = res.data;

        setProfile(data?.profile ?? null);

        const cards = (data?.characters ?? []).map((c) => ({
          id: c.characterId,
          name: c.name,
          grade: c.grade,
          image: toFullImageUrl(
            c.imageUrl || c.imageAddress || c.imagePath || c.imageName
          ),
          hp: null,
          def: null,
          atk: null,
          critRate: null,
        }));

        setCharacters(cards);
        setError(null);
      } catch (e) {
        console.error(e);
        setError("마이페이지 데이터를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, []); // ✅ 의존성 비움

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-200/70 flex items-center justify-center">
        로딩 중...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-200/70 flex items-center justify-center text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200/70 flex flex-col">
      <Header />
      <main className="flex-1">
        <MyMain
          nickname={profile?.nickname ?? "마스터 님"}
          ticketCount={profile?.ticketCount ?? 0}
          onPickClick={handlePick}
          characters={characters}
        />
      </main>
      <Footer />
    </div>
  );
}

/** 마이페이지 메인 */
function MyMain({
  nickname = "마스터 님",
  ticketCount = 5,
  onPickClick = () => {},
  characters = [],
}) {
  const [selected, setSelected] = useState(null);
  const onOpenCharacter = (c) => setSelected(c);

  const navigate = useNavigate();

  const onGrow = () => alert(`${selected?.name} 성장시키기`);

  const onChat = () => {
    if (selected?.id) {
      navigate(`/chat/${selected.id}`);
    } else {
      alert("캐릭터를 먼저 선택하세요!");
    }
  };

  const onSend = () => alert(`${selected?.name} 보내기`);

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-8">
      {/* 프로필카드 + (선택 시) 상세패널 */}
      <div className="grid gap-6 md:grid-cols-[minmax(320px,540px),1fr] md:items-stretch">
        {/* 프로필 카드 */}
        <section className="bg-white border-2 border-black rounded-[28px] p-6 w-full h-full">
          <div className="flex items-start gap-6">
            {/* 왼쪽: 아바타 + 아이콘 */}
            <div className="shrink-0 flex flex-col items-center">
              <div className="w-36 h-36 md:w-44 md:h-44 rounded-full bg-gray-300" />
              <div className="mt-6 flex items-center gap-5 text-gray-800">
                <NotificationBell />
                <IconMail />
                <IconMore />
              </div>
            </div>

            {/* 오른쪽: 텍스트 */}
            <div className="flex-1 pt-2">
              <div className="text-2xl md:text-[28px] font-semibold text-gray-900">
                {nickname}
              </div>
              <div className="mt-2 text-lg md:text-xl text-gray-900 flex items-center gap-2">
                보유 부화권 <span className="font-semibold">{ticketCount}</span>
                <span role="img" aria-label="ticket">🎟️</span>
              </div>
            </div>
          </div>
        </section>

        {/* 선택된 캐릭터가 있으면 상세 패널 */}
        {selected && (
          <CharacterDetail
            character={selected}
            onGrow={onGrow}
            onChat={onChat}
            onSend={onSend}
          />
        )}
      </div>

      {/* 섹션 타이틀 */}
      <h2 className="mt-8 mb-4 text-xl md:text-2xl font-semibold text-gray-900">
        내 캐릭터
      </h2>

      {/* 캐릭터 섹션 */}
      <CharacterSection
        characters={characters}
        selectedId={selected?.id}
        onPickClick={onPickClick}
        onOpenCharacter={onOpenCharacter}
      />
    </div>
  );
}

/* ===== 캐릭터 상세 패널 ===== */
function CharacterDetail({ character, onGrow, onChat, onSend }) {
  const { name, grade, hp, def, atk, critRate } = character ?? {};
  const fmt = (v, suffix = "") => (v == null ? "-" : `${v}${suffix}`);
  return (
    <section className="bg-gray-300 rounded-md p-6 h-full flex flex-col justify-between">
      {/* 좌/우 스탯 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-gray-900">
        <div className="text-2xl md:text-3xl font-extrabold space-y-2">
          <div>등급: {fmt(grade)}</div>
          <div>체력: {fmt(hp)}</div>
          <div>방어력: {fmt(def)}</div>
        </div>
        <div className="text-2xl md:text-3xl font-extrabold space-y-2 sm:text-right">
          <div>이름: {fmt(name)}</div>
          <div>공격력: {fmt(atk)}</div>
          <div>치명타 확률: {critRate == null ? "-" : `${critRate}%`}</div>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="mt-6 overflow-x-auto">
        <div className="flex flex-nowrap items-center gap-4">
          <button
            onClick={onGrow}
            className="shrink-0 whitespace-nowrap px-6 md:px-8 py-3 rounded-xl bg-white border shadow-sm
                      text-xl md:text-2xl font-semibold hover:bg-gray-50 active:bg-gray-100 transition"
          >
            성장시키기
          </button>
          <button
            onClick={onChat}
            className="shrink-0 whitespace-nowrap px-6 md:px-8 py-3 rounded-xl bg-white border shadow-sm
                      text-xl md:text-2xl font-semibold hover:bg-gray-50 active:bg-gray-100 transition"
          >
            대화 하기
          </button>
          <button
            onClick={onSend}
            className="shrink-0 whitespace-nowrap px-6 md:px-8 py-3 rounded-xl bg-white border shadow-sm
                      text-xl md:text-2xl font-semibold hover:bg-gray-50 active:bg-gray-100 transition"
          >
            보내기
          </button>
        </div>
      </div>
    </section>
  );
}

/* ===== 내 캐릭터 섹션 ===== */
function CharacterSection({ characters = [], selectedId, onPickClick, onOpenCharacter }) {
  const hasCharacters = characters.length > 0;

  if (!hasCharacters) {
    return (
      <section className="rounded-md bg-gray-300 min-h-[340px] flex items-center justify-center">
        <div className="text-center px-6 py-12">
          <div className="text-2xl md:text-3xl text-gray-800 mb-6">내 캐릭터를 뽑아주세요!</div>
          <button
            onClick={onPickClick}
            className="px-8 py-3 rounded bg-white border text-gray-900 text-lg hover:bg-gray-50 active:bg-gray-100 transition"
          >
            뽑으러가기
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-md bg-gray-300 py-6 px-5">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-6">
        {characters.map((c) => (
          <CharacterCard
            key={c.id}
            character={c}
            active={selectedId === c.id}
            onClick={() => onOpenCharacter?.(c)}
          />
        ))}

        {/* 플러스 카드 */}
        <button
          onClick={onPickClick}
          className="aspect-square rounded-2xl bg-white border border-gray-200 flex items-center justify-center
                     hover:bg-gray-50 active:bg-gray-100 transition"
          aria-label="캐릭터 추가"
        >
          <span className="text-7xl leading-none text-gray-900">+</span>
        </button>
      </div>
    </section>
  );
}

function CharacterCard({ character, active, onClick }) {
  return (
    <div className="select-none">
      <button
        onClick={onClick}
        className={`aspect-square w-full rounded-2xl overflow-hidden bg-white border
                    ${active ? "border-sky-400 ring-2 ring-sky-300" : "border-gray-200 hover:border-gray-300"}
                    active:scale-[0.99] transition`}
        aria-label={character.name}
      >
        <div className="w-full h-full p-3 flex items-center justify-center">
          <img
            src={character.image}
            alt={character.name}
            className="max-h-full max-w-full object-contain"
            onError={(e) => { e.currentTarget.style.opacity = 0; }}
          />
        </div>
      </button>
      <div className="mt-2 text-lg font-medium text-gray-900">{character.name}</div>
    </div>
  );
}

/* ===== 알림 벨 ===== */
function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [gearOpen, setGearOpen] = useState(false);
  const [tab, setTab] = useState("new"); // 'new' | 'read'
  const [items, setItems] = useState([
    { id: 1, text: "가입을 축하합니다 마스터님", read: true },
    { id: 2, text: "내 커뮤니티 글에 댓글이 달렸습니다", read: false },
    { id: 3, text: "보유 부화권 5개 구매하셨습니다", read: false },
  ]);

  const btnRef = useRef(null);
  const popRef = useRef(null);
  const gearRef = useRef(null);

  const newList = items.filter((i) => !i.read);
  const readList = items.filter((i) => i.read);
  const visible = tab === "new" ? newList : readList;

  const markAllRead = () => setItems((prev) => prev.map((i) => ({ ...i, read: true })));
  const deleteAll = () => setItems([]);
  const deleteOne = (id) => setItems((prev) => prev.filter((i) => i.id !== id));

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => { setOpen((v) => !v); setGearOpen(false); }}
        className="relative rounded-full p-1.5 hover:bg-gray-100 active:bg-gray-200"
        aria-label="알림 열기"
      >
        <svg width="45" height="45" viewBox="0 0 24 24" fill="none">
          <path d="M15 17H9m9-1V11a6 6 0 10-12 0v5l-1 2h14l-1-2z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10 19a2 2 0 004 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {newList.length > 0 && (
          <span className="absolute -right-1 -top-1 h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[10px] leading-4 text-center">
            {newList.length}
          </span>
        )}
      </button>

      {open && (
        <div ref={popRef} className="absolute z-50 left-0 top-10 w-[360px] rounded-xl border bg-white shadow-xl">
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <div className="flex items-center gap-2">
              <button onClick={() => setTab("new")}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${tab === "new" ? "bg-gray-200 text-gray-900" : "hover:bg-gray-100"}`}>
                새 알림
              </button>
              <button onClick={() => setTab("read")}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${tab === "read" ? "bg-gray-200 text-gray-900" : "hover:bg-gray-100"}`}>
                읽은 알림
              </button>
            </div>

            <div className="relative">
              <button
                ref={gearRef}
                onClick={() => setGearOpen((v) => !v)}
                className="p-1.5 rounded hover:bg-gray-100 active:bg-gray-200"
                aria-label="알림 설정"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" stroke="currentColor" strokeWidth="1.6"/>
                  <path d="M19 12a7 7 0 01-.1 1.2l2 1.5-2 3.4-2.3-.9a6.9 6.9 0 01-2 .9l-.4 2.4H9.8l-.4-2.4a6.9 6.9 0 01-2-.9l-2.3.9-2-3.4 2-1.5A7 7 0 017 12c0-.4 0-.8.1-1.2l-2-1.5 2-3.4 2.3.9c.6-.4 1.3-.7 2-.9l.4-2.4h3.1l.4 2.4c.7.2 1.4.5 2 .9l2.3-.9 2 3.4-2 1.5c.1.4.1.8.1 1.2z" stroke="currentColor" strokeWidth="1.2"/>
                </svg>
              </button>

              {gearOpen && (
                <div className="absolute left-full top-0 ml-2 w-40 rounded-lg border bg-white shadow-lg overflow-hidden z-[60] origin-top-left">
                  <button onClick={() => { markAllRead(); setGearOpen(false); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors">
                    모두 읽음
                  </button>
                  <button onClick={() => { deleteAll(); setGearOpen(false); }}
                          className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                    알림 전체 삭제
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-auto p-3">
            {visible.length === 0 ? (
              <div className="py-16 text-center text-gray-500">
                {tab === "new" ? "새 알림이 없어요" : "읽은 알림이 없어요"}
              </div>
            ) : (
              <ul className="space-y-2">
                {visible.map((n) => (
                  <li
                    key={n.id}
                    tabIndex={0}
                    role="button"
                    className="relative group cursor-pointer rounded-md px-3 py-3
                               border border-gray-200 bg-white
                               transition-colors duration-150
                               hover:bg-sky-50 hover:border-sky-300
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                  >
                    <p className="pr-8 text-sm text-gray-900">{n.text}</p>
                    <button
                      onClick={() => deleteOne(n.id)}
                      className="absolute right-1 top-1 opacity-0 group-hover:opacity-100
                                 transition-opacity text-xs px-1.5 py-0.5 rounded
                                 bg-black/5 hover:bg-black/10"
                      aria-label="알림 삭제"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== 기타 아이콘 ===== */
function IconMail(props) {
  return (
    <svg width="45" height="45" viewBox="0 0 24 24" fill="none" {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.7"/>
      <path d="M3.5 7l8.5 6 8.5-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function IconMore(props) {
  return (
    <svg width="45" height="45" viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="6" cy="12" r="1.7" fill="currentColor"/>
      <circle cx="12" cy="12" r="1.7" fill="currentColor"/>
      <circle cx="18" cy="12" r="1.7" fill="currentColor"/>
    </svg>
  );
}
