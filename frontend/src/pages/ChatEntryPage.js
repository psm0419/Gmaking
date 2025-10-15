import React, { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import axiosInstance from "../api/axiosInstance";
import { useNavigate, useParams } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_BASE || "";

const API = {
  characters: "/api/chat/characters",
};

// 이미지 경로 보정 (ChatPage와 동일 로직)
function toFullImageUrl(raw) {
  let url = raw || "/images/character/placeholder.png";
  if (/^https?:\/\//i.test(url)) return url; // 절대경로면 그대로
  url = url.replace(/^\/?static\//i, "/"); // /static/ 제거
  url = url.replace(/^\/?character\//i, "/images/character/"); // /character/ 정규화
  if (url.startsWith("/")) return url;
  if (url.startsWith("images/")) return `/${url}`;
  return `/images/${url}`;
}

// 서버 응답 정규화 (id, name, imageUrl 3가지만 사용)
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
      imageUrl: toFullImageUrl(c.imageUrl ?? c.profileImageUrl ?? c.imagePath ?? c.imageName),
    }))
    .filter((c) => c.id);
}

export default function ChatEntryPage() {
  const navigate = useNavigate();
  const { characterId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [characters, setCharacters] = useState([]); // [{id, name, imageUrl}]
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await axiosInstance.get(API.characters);
        const list = normalizeCharacters(res?.data);
        setCharacters(list);

        if (list.length) {
           // characterId가 있으면 해당 캐릭터 자동 선택
           const preferId = characterId?.toString();
           if (preferId) {
              const found = list.find((c) => String(c.id) === preferId);
              setSelectedId(found ? found.id : list[0].id);
           } else {
             setSelectedId(list[0].id);
           }
        }

      } catch (e) {
        console.error("캐릭터 목록 조회 실패: ", e);
        setError("캐릭터 목록을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return characters;
    return characters.filter((c) => (c.name || "").toLowerCase().includes(q));
  }, [characters, search]);

  const selected = useMemo(
    () => characters.find((c) => c.id === selectedId) || null,
    [characters, selectedId]
  );

const enterChat = async () => {
  if (!selectedId) return;
  try {
    // 입장 API 먼저 호출 (페르소나 생성 + 첫인사까지 서버에서 처리)
    const { data } = await axiosInstance.post(`/api/chat/${selectedId}/enter`);

    // 응답 payload를 state로 넘기면서 채팅 페이지로 이동
    navigate(`/chat/${encodeURIComponent(selectedId)}`, {
      state: { enterPayload: data },
    });
  } catch (e) {
    console.error("입장 처리 실패:", e);
    alert("채팅방 입장에 실패했습니다.");
  }
}

  return (
    <div className="min-h-screen w-full bg-gray-200/70 flex flex-col font-sans">
      <Header />

      <main className="flex-1 flex items-center justify-center">
        <div className="w-[1200px] h-[680px] rounded-[48px] bg-gray-300/60 p-6 shadow-inner">
          <div className="w-full h-full min-h-0 rounded-[36px] bg-white overflow-hidden relative flex">
            {/* 좌측: 선택/검색 */}
            <aside className="w-[420px] border-r bg-white/60 p-6 flex flex-col gap-4 min-h-0">
              <h2 className="text-xl font-semibold tracking-tight">채팅 입장하기</h2>
              <p className="text-sm text-gray-500">대화할 캐릭터를 선택하세요.</p>

              <div className="relative">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="캐릭터 검색 (이름)"
                />
              </div>

              <div className="mt-2 grid grid-cols-1 gap-3 overflow-y-auto pr-1" style={{ maxHeight: 440 }}>
                {loading && (
                  <div className="text-sm text-gray-500">로딩 중…</div>
                )}
                {!loading && error && (
                  <div className="text-sm text-red-500">{error}</div>
                )}
                {!loading && !error && filtered.length === 0 && (
                  <div className="text-sm text-gray-500">조건에 맞는 캐릭터가 없어요.</div>
                )}
                {!loading && !error &&
                  filtered.map((c) => (
                    <CharacterRow
                      key={c.id}
                      active={selectedId === c.id}
                      imageUrl={c.imageUrl}
                      name={c.name}
                      onClick={() => setSelectedId(c.id)}
                    />
                  ))}
              </div>
            </aside>

            {/* 우측: 미리보기 + 입장 버튼 */}
            <section className="flex-1 p-10 flex flex-col">
              <div className="flex-1 flex items-center justify-center">
                {selected ? (
                  <PreviewCard character={selected} />
                ) : (
                  <div className="text-gray-500">왼쪽에서 캐릭터를 선택하세요.</div>
                )}
              </div>

              <div className="border-t pt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="h-12 rounded-2xl px-5 text-gray-700 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 border border-gray-200"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={enterChat}
                  disabled={!selectedId}
                  className="h-12 rounded-2xl px-6 font-semibold text-white bg-blue-600 hover:bg-blue-600/90 active:bg-blue-700 disabled:bg-gray-300 disabled:text-white/70 shadow-sm"
                >
                  채팅방 입장
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function CharacterRow({ active, imageUrl, name, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full rounded-2xl border p-3 text-left transition-all flex items-center gap-3 shadow-sm ${
        active
          ? "bg-blue-50/80 border-blue-300 ring-1 ring-blue-200"
          : "bg-white hover:bg-gray-50 border-gray-200"
      }`}
      title={name}
    >
      <div className="w-[56px] h-[56px] rounded-full overflow-hidden ring-1 ring-black/5 bg-white shrink-0">
        {imageUrl ? (
          <img src={imageUrl} alt={name || "character"} className="w-full h-full object-cover" draggable={false} />
        ) : (
          <div className="w-full h-full grid place-items-center text-neutral-400 text-xs">No Image</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="truncate font-medium text-gray-900">{name || "이름 없음"}</div>
        <div className="text-xs text-gray-500">클릭하여 선택</div>
      </div>
      {active && (
        <div className="text-xs font-semibold text-blue-700">선택됨</div>
      )}
    </button>
  );
}

function PreviewCard({ character }) {
  return (
    <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-[220px,1fr] gap-8 items-center">
      <div className="w-[220px] h-[220px] rounded-3xl overflow-hidden ring-1 ring-black/10 bg-gray-50 mx-auto md:mx-0">
        {character.imageUrl ? (
          <img
            src={character.imageUrl}
            alt={character.name || "character"}
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-neutral-400">No Image</div>
        )}
      </div>
      <div className="flex flex-col gap-3">
        <h3 className="text-2xl font-semibold tracking-tight text-gray-900">
          {character.name}
        </h3>
        <p className="text-sm text-gray-600">
          선택한 캐릭터로 채팅방에 입장합니다. 입장 후 언제든 다른 캐릭터로 전환할 수 있어요.
        </p>
        <ul className="mt-2 text-sm text-gray-500 list-disc list-inside space-y-1">
          <li>대화 내용은 서버 히스토리에 저장됩니다.</li>
          <li>부적절한 내용은 제한될 수 있어요.</li>
        </ul>
      </div>
    </div>
  );
}
