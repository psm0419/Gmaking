import React, { useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { jwtDecode } from "jwt-decode";

// Vite/CRA 모두 대응
const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE) ||
  process.env.REACT_APP_API_BASE ||
  "";

// 엔드포인트
const API = {
  characters: "/api/chat/characters",
};

const IMG_PLACEHOLDER = "/images/character/placeholder.png";

/** 액세스 토큰 가져오기 (AuthContext → localStorage 순) */
function getAccessToken(auth) {
  const fromCtx =
    auth?.accessToken || auth?.token || auth?.user?.accessToken || null;
  if (fromCtx) return String(fromCtx);

  const keys = ["accessToken", "jwt", "token"];
  for (const k of keys) {
    const v = localStorage.getItem(k);
    if (v) return v.replace(/^"|"$/g, "");
  }
  return null;
}

/** jwt-decode로 payload 파싱 */
function parseJwt(token) {
  try {
    return jwtDecode(token);
  } catch {
    return null;
  }
}

/** 토큰 만료 여부 (기본 30초 스큐) */
function isTokenExpired(token, skewSec = 30) {
  const payload = parseJwt(token);
  if (!payload?.exp) return false; // exp 없으면 만료 판단 보류(서버에 맡김)
  const now = Math.floor(Date.now() / 1000);
  return payload.exp <= now + skewSec;
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
      id:   c.id ?? c.characterId ?? c.CHARACTER_ID,
      name: c.name ?? c.characterName ?? c.CHARACTER_NAME,
      imageUrl:
        c.imageUrl ?? c.profileImageUrl ?? c.imagePath ?? c.imageName ?? null, // 보정 X
    }))
    .filter((c) => c.id);
}

export default function ChatEntryPage() {
  useEffect(() => {
    document.body.classList.add('no-scrollbar');
    document.documentElement.classList.add('no-scrollbar');
    return () => {
      document.body.classList.remove('no-scrollbar');
      document.documentElement.classList.remove('no-scrollbar');
    };
  }, []);

  const navigate = useNavigate();
  const { characterId } = useParams();
  const auth = useAuth?.() || {};
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

        const token = getAccessToken(auth);
        if (!token) {
          setError("로그인이 필요합니다.");
          return;
        }
        if (isTokenExpired(token)) {
          setError("인증이 만료되었어요. 다시 로그인해주세요.");
          return;
        }

        const res = await axios.get(`${API_BASE}${API.characters}`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: false,
        });

        const list = normalizeCharacters(res?.data);
        setCharacters(list);

        if (list.length) {
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
        if (e?.response?.status === 401) {
          setError("인증이 만료되었어요. 다시 로그인해주세요.");
        } else {
          setError("캐릭터 목록을 불러오지 못했습니다.");
        }
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterId]);

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
      const token = getAccessToken(auth);
      if (!token) {
        alert("로그인이 필요합니다.");
        return;
      }
      if (isTokenExpired(token)) {
        alert("인증이 만료되었어요. 다시 로그인해주세요.");
        return;
      }

      const { data } = await axios.post(
        `${API_BASE}/api/chat/${encodeURIComponent(selectedId)}/enter`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: false,
        }
      );

      navigate(`/chat/${encodeURIComponent(selectedId)}`, {
        state: { enterPayload: data },
      });
    } catch (e) {
      console.error("입장 처리 실패:", e);
      if (e?.response?.status === 401) {
        alert("인증이 만료되었어요. 다시 로그인해주세요.");
      } else {
        alert("채팅방 입장에 실패했습니다.");
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-200/70 flex flex-col font-sans">
      <Header />

      <main className="flex-1 flex items-center justify-center">
        <div className="w-[1200px] h-[680px] rounded-[48px] bg-gray-800 p-6 p-6 shadow-inner transform translate-y-8">
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

              <div className="mt-2 grid grid-cols-1 gap-3 overflow-y-auto pr-1 no-scrollbar" style={{ maxHeight: 440 }}>
                {loading && <div className="text-sm text-gray-500">로딩 중…</div>}
                {!loading && error && <div className="text-sm text-red-500">{error}</div>}
                {!loading && !error && filtered.length === 0 && (
                  <div className="text-sm text-gray-500">조건에 맞는 캐릭터가 없어요.</div>
                )}
                {!loading &&
                  !error &&
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
  const src = imageUrl || IMG_PLACEHOLDER;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full rounded-2xl border p-3 text-left transition-all flex items-center gap-3 shadow-sm ${
        active ? "bg-blue-50/80 border-blue-300 ring-1 ring-blue-200" : "bg-white hover:bg-gray-50 border-gray-200"
      }`}
      title={name}
    >
      <div className="w-[56px] h-[56px] rounded-full overflow-hidden ring-1 ring-black/5 bg-white shrink-0">
        <img
          src={src}
          alt={name || "character"}
          className="w-full h-full object-cover"
          draggable={false}
          loading="lazy"
          onError={(e) => {
            if (e.currentTarget.dataset.fallbackApplied) return;
            e.currentTarget.dataset.fallbackApplied = "1";
            e.currentTarget.src = IMG_PLACEHOLDER;
          }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="truncate font-medium text-gray-900">{name || "이름 없음"}</div>
        <div className="text-xs text-gray-500">클릭하여 선택</div>
      </div>
      {active && <div className="text-xs font-semibold text-blue-700">선택됨</div>}
    </button>
  );
}

function PreviewCard({ character }) {
  const src = character?.imageUrl || IMG_PLACEHOLDER;
  return (
    <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-[220px,1fr] gap-8 items-center">
      <div className="w-[220px] h-[220px] rounded-3xl overflow-hidden ring-1 ring-black/10 bg-gray-50 mx-auto md:mx-0">
        <img
          src={src}
          alt={character?.name || "character"}
          className="w-full h-full object-cover"
          draggable={false}
          onError={(e) => {
            if (e.currentTarget.dataset.fallbackApplied) return;
            e.currentTarget.dataset.fallbackApplied = "1";
            e.currentTarget.src = IMG_PLACEHOLDER;
          }}
        />
      </div>
      <div className="flex flex-col gap-3">
        <h3 className="text-2xl font-semibold tracking-tight text-gray-900">{character?.name}</h3>
        <p className="text-sm text-gray-600">선택한 캐릭터로 채팅방에 입장합니다. 입장 후 언제든 다른 캐릭터로 전환할 수 있어요.</p>
        <ul className="mt-2 text-sm text-gray-500 list-disc list-inside space-y-1">
          <li>대화 내용은 서버 히스토리에 저장됩니다.</li>
          <li>부적절한 내용은 제한될 수 있어요.</li>
        </ul>
      </div>
    </div>
  );
}
